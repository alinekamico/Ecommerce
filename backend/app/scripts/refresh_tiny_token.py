"""Renova o access_token do Tiny proativamente.

Roda via systemd timer (nao pelo HTTP) porque nao ha usuario logado nesse contexto.
O access_token dura 4h e o refresh_token 1 dia - se ninguem usar o sistema por mais
de 1 dia, o refresh_token expira e alguem precisa autorizar de novo pelo navegador.
"""

import sys

from app.db.database import SessionLocal
from app.services import tiny_oauth


def main() -> int:
    db = SessionLocal()
    try:
        tiny_oauth.get_valid_access_token(db)
        print("Token do Tiny valido/renovado com sucesso.")
        return 0
    except tiny_oauth.TinyOAuthError as exc:
        print(f"Falha ao renovar o token do Tiny: {exc}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
