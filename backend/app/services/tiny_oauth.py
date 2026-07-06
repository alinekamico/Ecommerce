from datetime import timedelta
from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.time import utcnow
from app.models.tiny_oauth_token import TinyOAuthToken

AUTHORIZE_URL = "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/auth"
TOKEN_URL = "https://accounts.tiny.com.br/realms/tiny/protocol/openid-connect/token"

# Renova o token um pouco antes de expirar, para nao correr risco de usar um token vencido
EXPIRY_SAFETY_MARGIN_SECONDS = 60


class TinyOAuthError(Exception):
    pass


def build_authorize_url() -> str:
    params = {
        "client_id": settings.TINY_CLIENT_ID,
        "redirect_uri": settings.TINY_REDIRECT_URI,
        "scope": "openid",
        "response_type": "code",
    }
    return f"{AUTHORIZE_URL}?{urlencode(params)}"


def _request_token(data: dict) -> dict:
    response = httpx.post(TOKEN_URL, data=data, timeout=15)
    if response.status_code != 200:
        raise TinyOAuthError(f"Falha ao obter token do Tiny: {response.status_code} {response.text}")
    return response.json()


def exchange_code_for_token(code: str) -> dict:
    return _request_token(
        {
            "grant_type": "authorization_code",
            "client_id": settings.TINY_CLIENT_ID,
            "client_secret": settings.TINY_CLIENT_SECRET,
            "redirect_uri": settings.TINY_REDIRECT_URI,
            "code": code,
        }
    )


def refresh_access_token(refresh_token: str) -> dict:
    return _request_token(
        {
            "grant_type": "refresh_token",
            "client_id": settings.TINY_CLIENT_ID,
            "client_secret": settings.TINY_CLIENT_SECRET,
            "refresh_token": refresh_token,
        }
    )


def save_token(db: Session, token_data: dict) -> TinyOAuthToken:
    now = utcnow()
    access_expires_at = now + timedelta(seconds=token_data["expires_in"])
    refresh_expires_at = now + timedelta(seconds=token_data["refresh_expires_in"])

    token = db.query(TinyOAuthToken).first()
    if token is None:
        token = TinyOAuthToken(
            access_token=token_data["access_token"],
            refresh_token=token_data["refresh_token"],
            access_token_expires_at=access_expires_at,
            refresh_token_expires_at=refresh_expires_at,
        )
        db.add(token)
    else:
        token.access_token = token_data["access_token"]
        token.refresh_token = token_data["refresh_token"]
        token.access_token_expires_at = access_expires_at
        token.refresh_token_expires_at = refresh_expires_at

    db.commit()
    db.refresh(token)
    return token


def get_valid_access_token(db: Session) -> str:
    token = db.query(TinyOAuthToken).first()
    if token is None:
        raise TinyOAuthError(
            "Nenhuma conexao com o Tiny encontrada. E preciso autorizar em "
            "/api/integrations/tiny/oauth/authorize primeiro."
        )

    now = utcnow()
    margin = timedelta(seconds=EXPIRY_SAFETY_MARGIN_SECONDS)

    if token.access_token_expires_at - margin > now:
        return token.access_token

    if token.refresh_token_expires_at - margin <= now:
        raise TinyOAuthError(
            "O refresh_token do Tiny expirou. E preciso autorizar novamente em "
            "/api/integrations/tiny/oauth/authorize."
        )

    token_data = refresh_access_token(token.refresh_token)
    token = save_token(db, token_data)
    return token.access_token
