from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.tiny import TinySkuLookupRequest, TinySkuLookupResponse
from app.services import tiny_oauth
from app.services.audit import log_action
from app.services.tiny_products import lookup_skus

router = APIRouter(prefix="/api/tiny/produtos", tags=["tiny-produtos"])


@router.post("/custos", response_model=TinySkuLookupResponse)
def consultar_custos(
    payload: TinySkuLookupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        access_token = tiny_oauth.get_valid_access_token(db)
    except tiny_oauth.TinyOAuthError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    skus = [sku.strip() for sku in payload.skus if sku.strip()]
    resultados = lookup_skus(access_token, skus)

    log_action(
        db,
        user_id=current_user.id,
        action="tiny_sku_lookup",
        entity="tiny_produto",
        details=f"{len(skus)} SKU(s) consultados",
    )

    return TinySkuLookupResponse(resultados=[r.to_dict() for r in resultados])
