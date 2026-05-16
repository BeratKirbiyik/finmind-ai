import asyncio
import google.generativeai as genai
from app.agents.state import AgentState
from app.agents.tools import get_user_transactions, get_user_info, compute_category_stats
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)

INTENT_PROMPT = """Kullanıcı mesajını analiz et. SADECE şu kelimelerden birini yaz:
spending_analysis, overspending, goal_planning, savings_advice, reporting, general

Mesaj: {message}"""

_model_flash = None

def get_flash_model():
    global _model_flash
    if _model_flash is None:
        _model_flash = genai.GenerativeModel("gemini-2.5-flash")
    return _model_flash

def _classify_intent(message: str) -> str:
    model = get_flash_model()
    return model.generate_content(
        INTENT_PROMPT.format(message=message)
    ).text.strip().lower()

async def data_analyst_node(state: AgentState, db) -> AgentState:
    loop = asyncio.get_event_loop()

    # Gemini intent çağrısını thread'de başlat (DB ile paralel çalışır)
    intent_task = loop.run_in_executor(None, _classify_intent, state["user_message"])

    # DB sorgularını sıralı çalıştır (aynı session'ı paylaşırlar)
    transactions = await get_user_transactions(db, state["user_id"], days=60)
    user_info = await get_user_info(db, state["user_id"])

    # Intent sonucunu bekle (DB biterken zaten çalışıyordu)
    intent_raw = await intent_task

    valid_intents = ["spending_analysis", "overspending", "goal_planning", "savings_advice", "reporting", "general"]
    intent = intent_raw if intent_raw in valid_intents else "general"
    category_stats = compute_category_stats(transactions)

    steps = state.get("steps_taken", [])
    steps.append("data_analyst")

    return {
        **state,
        "intent": intent,
        "raw_transactions": transactions,
        "analysis": {
            "category_stats": category_stats,
            "total_spent": round(sum(t["amount"] for t in transactions), 2),
            "transaction_count": len(transactions),
            "user_info": user_info,
            "period_days": 60,
        },
        "steps_taken": steps,
    }
