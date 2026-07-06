import hashlib
import logging
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.core.time import utcnow
from app.db.database import get_db
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserOut
from app.services.audit import log_action
from app.services.email import send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

PASSWORD_RESET_EXPIRE_MINUTES = 30


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).order_by(User.name).all()


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail ja cadastrado")

    user = User(
        name=payload.name,
        email=payload.email,
        department=payload.department,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_action(db, user_id=current_user.id, action="create_user", entity="user", entity_id=user.id)
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha invalidos",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Usuario inativo")

    token = create_access_token(subject=str(user.id), role=user.role.value)
    log_action(db, user_id=user.id, action="login", entity="user", entity_id=user.id)
    return TokenResponse(access_token=token)


@router.post("/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Nao revela se o e-mail existe ou nao
        return

    raw_token = secrets.token_urlsafe(32)
    reset = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_token(raw_token),
        expires_at=utcnow() + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES),
    )
    db.add(reset)
    db.commit()

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
    try:
        send_password_reset_email(user.email, reset_link)
    except Exception:
        # Nao expoe falha de SMTP ao cliente (evita vazar detalhes de infraestrutura
        # e mante a mesma resposta independente do e-mail existir ou nao)
        logger.exception("Falha ao enviar e-mail de redefinicao de senha para %s", user.email)

    log_action(db, user_id=user.id, action="forgot_password_requested", entity="user", entity_id=user.id)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = _hash_token(payload.token)
    reset = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()

    invalid_error = HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Link invalido ou expirado")

    if not reset or reset.used_at is not None:
        raise invalid_error
    if reset.expires_at < utcnow():
        raise invalid_error

    user = db.get(User, reset.user_id)
    if not user:
        raise invalid_error

    user.hashed_password = hash_password(payload.new_password)
    reset.used_at = utcnow()
    db.commit()

    log_action(db, user_id=user.id, action="password_reset", entity="user", entity_id=user.id)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
