import ssl
import os
import re
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)

_db_url = os.environ.get("DATABASE_URL", "")

if not _db_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Add it in Railway → Service → Variables."
    )

if _db_url.startswith("postgresql://") or _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)


def _bypass_pgbouncer(url: str) -> str:
    """
    Supabase pooler URL'sini doğrudan bağlantıya çevirir.
    Pooler (pgbouncer) transaction mode prepared statement'larla uyumsuz.

    postgres.PROJECT_REF:PASS@*.pooler.supabase.com:PORT/postgres
      →  postgres:PASS@db.PROJECT_REF.supabase.co:5432/postgres
    """
    if ".pooler.supabase.com" not in url:
        return url
    m = re.search(r"://postgres\.([^:@]+):", url)
    if not m:
        return url
    ref = m.group(1)
    url = url.replace(f"postgres.{ref}:", "postgres:", 1)
    url = re.sub(
        r"@[^/]+\.pooler\.supabase\.com:\d+/",
        f"@db.{ref}.supabase.co:5432/",
        url,
    )
    logger.info("pgbouncer bypass aktif — doğrudan PostgreSQL bağlantısı kullanılıyor")
    return url


_db_url = _bypass_pgbouncer(_db_url)

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    _db_url,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"ssl": ssl_ctx},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
