import ssl
import os
import uuid
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

# asyncpg requires postgresql+asyncpg:// scheme
if _db_url.startswith("postgresql://") or _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    _db_url = _db_url.replace("postgres://", "postgresql+asyncpg://", 1)

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

engine = create_async_engine(
    _db_url,
    # Persistent pool: same asyncpg connection is reused per slot,
    # so prepared statements never collide across requests.
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,       # drop stale connections automatically
    pool_recycle=300,         # recycle every 5 min
    connect_args={
        "ssl": ssl_ctx,
        "statement_cache_size": 0,   # disable asyncpg LRU statement cache
    },
    # Unique prepared-statement names guard against any residual
    # pgbouncer transaction-mode conflicts.
    execution_options={
        "asyncpg_prepared_statement_name_func": lambda: f"__s_{uuid.uuid4().hex}"
    },
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
