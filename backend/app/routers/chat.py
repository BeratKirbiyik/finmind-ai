from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.agents.orchestrator import build_graph
from app.agents.state import AgentState
import json
import hashlib

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: str
    message: str

@router.post("/")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    try:
        cache_key = f"chat:{request.user_id}:{hashlib.md5(request.message.encode()).hexdigest()}"

        try:
            from app.config import settings
            import redis.asyncio as aioredis
            r = aioredis.from_url(settings.redis_url, decode_responses=True)
            cached = await r.get(cache_key)
            if cached:
                await r.aclose()
                return json.loads(cached)
            await r.aclose()
        except Exception:
            pass

        graph = build_graph(db)
        initial_state: AgentState = {
            "user_id": request.user_id,
            "user_message": request.message,
            "intent": None,
            "raw_transactions": None,
            "analysis": None,
            "behavioral_profile": None,
            "rag_context": None,
            "coach_response": None,
            "final_response": None,
            "error": None,
            "steps_taken": [],
        }
        result = await graph.ainvoke(initial_state)

        response = {
            "response": result.get("final_response", "Üzgünüm, bir hata oluştu."),
            "intent": result.get("intent"),
            "steps_taken": result.get("steps_taken", []),
            "behavioral_profile": result.get("behavioral_profile"),
        }

        try:
            r = aioredis.from_url(settings.redis_url, decode_responses=True)
            await r.setex(cache_key, 300, json.dumps(response, ensure_ascii=False))
            await r.aclose()
        except Exception:
            pass

        return response

    except Exception as e:
        return {
            "response": f"Sistem hatası: {str(e)}",
            "intent": "error",
            "steps_taken": [],
        }

@router.get("/health")
async def chat_health():
    return {"status": "ok", "agents": ["data_analyst", "behavioral_profiler", "financial_coach", "reporting"]}
