from contextlib import asynccontextmanager
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, transactions, chat
from app.routers import goals, analytics, vision
from app.database import init_db
from app.rag.knowledge_base import initialize_knowledge_base

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await init_db()
        logger.info("Database tables ready")
    except Exception as e:
        logger.error(f"DB init failed: {e}")
    try:
        await initialize_knowledge_base()
    except Exception as e:
        logger.error(f"RAG init failed: {e}")
    yield

app = FastAPI(title="FinMind AI API", version="2.0.0", lifespan=lifespan, redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(vision.router, prefix="/api/vision", tags=["vision"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "FinMind AI", "version": "2.0.0"}
