from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.database import get_db
from app.models.user import User
from app.services import tiny_oauth
from app.services.audit import log_action

router = APIRouter(prefix="/api/integrations/tiny/oauth", tags=["integrations-tiny"])


@router.get("/authorize")
def authorize():
    # Rota navegada diretamente no navegador (redirect do Tiny), por isso nao usa
    # o Bearer token do nosso JWT. Deve ficar restrita por rede (VPN/IP interno)
    # quando publicada na AWS, ja que qualquer um com a URL pode iniciar o fluxo
    # (mas so quem tem login no Tiny consegue de fato autorizar).
    return RedirectResponse(tiny_oauth.build_authorize_url())


@router.get("/callback", response_class=HTMLResponse)
def callback(
    db: Session = Depends(get_db),
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
):
    if error:
        return f"<h1>Autorizacao com o Tiny falhou</h1><p>{error}</p>"
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parametro 'code' ausente")

    token_data = tiny_oauth.exchange_code_for_token(code)
    tiny_oauth.save_token(db, token_data)
    log_action(db, user_id=None, action="tiny_oauth_connected", entity="tiny_oauth_token")

    return "<h1>Conexao com o Tiny estabelecida com sucesso.</h1><p>Pode fechar esta janela.</p>"


@router.post("/refresh")
def force_refresh(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    try:
        access_token = tiny_oauth.get_valid_access_token(db)
    except tiny_oauth.TinyOAuthError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    log_action(db, user_id=current_user.id, action="tiny_oauth_refreshed", entity="tiny_oauth_token")
    return {"status": "ok", "access_token_preview": access_token[:8] + "..."}
