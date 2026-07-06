from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    DB_SSL_CA: str | None = None

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str
    SMTP_APP_PASSWORD: str
    SMTP_FROM_NAME: str = "KAMI CO. Ecommerce"

    FRONTEND_URL: str = "http://localhost:3000"

    TINY_CLIENT_ID: str
    TINY_CLIENT_SECRET: str
    TINY_REDIRECT_URI: str = "http://localhost:8000/api/integrations/tiny/oauth/callback"

    ENVIRONMENT: str = "development"


settings = Settings()
