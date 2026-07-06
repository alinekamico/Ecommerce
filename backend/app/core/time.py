from datetime import datetime, timezone


def utcnow() -> datetime:
    """UTC atual, naive (sem tzinfo) - MySQL/SQLite nao guardam timezone,
    entao mantemos tudo naive para evitar erro de comparacao offset-naive vs offset-aware."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
