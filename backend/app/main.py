from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, integrations_tiny, tiny_produtos
from app.core.config import settings

app = FastAPI(title="KAMI CO. Ecommerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(integrations_tiny.router)
app.include_router(tiny_produtos.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
