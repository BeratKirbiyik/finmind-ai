import google.generativeai as genai
from app.agents.state import AgentState
from app.config import settings
import datetime

genai.configure(api_key=settings.gemini_api_key)

def calculate_monthly_score(transactions: list, monthly_income: float) -> dict:
    if not transactions:
        return {"score": 50, "badges": [], "breakdown": {}}

    cutoff = (datetime.datetime.utcnow() - datetime.timedelta(days=30)).isoformat()
    last_30_days = [t for t in transactions if t["date"] >= cutoff]

    monthly_spent = sum(t["amount"] for t in last_30_days)
    monthly_budget = monthly_income if monthly_income > 0 else 20000

    budget_score = max(0, min(40, int((1 - monthly_spent / monthly_budget) * 40)))
    diversity_score = min(20, len({t["category"] for t in last_30_days}) * 4)
    consistency_score = 20 if len(last_30_days) <= 40 else max(0, 20 - (len(last_30_days) - 40) * 2)
    base_score = 20

    total = max(0, min(100, budget_score + diversity_score + consistency_score + base_score))

    badges = []
    if budget_score >= 35:
        badges.append("💰 Bütçe Ustası")
    if monthly_spent < monthly_budget * 0.5:
        badges.append("🏆 Süper Tasarrufçu")
    if len(last_30_days) <= 15:
        badges.append("🎯 Bilinçli Harcayıcı")

    return {
        "score": total,
        "badges": badges,
        "monthly_spent": round(monthly_spent, 2),
        "monthly_budget": round(monthly_budget, 2),
        "breakdown": {
            "budget": budget_score,
            "diversity": diversity_score,
            "consistency": consistency_score,
        }
    }

async def reporting_node(state: AgentState, db) -> AgentState:
    model = genai.GenerativeModel("gemini-2.5-flash")
    transactions = state.get("raw_transactions", [])
    analysis = state.get("analysis", {})
    user_info = analysis.get("user_info", {})
    monthly_income = user_info.get("monthly_income", 0)

    score_data = calculate_monthly_score(transactions, monthly_income)
    category_stats = analysis.get("category_stats", {})

    prompt = f"""
Kullanıcının aylık finans raporunu oluştur. Türkçe yaz. Dostane ve motive edici ol.
ÖNEMLI: Yanıtı düz metin olarak yaz. Markdown kullanma. ** işareti kullanma.

AYLIK SKOR: {score_data['score']}/100
KAZANILAN ROZETLER: {', '.join(score_data['badges']) if score_data['badges'] else 'Henüz rozet yok'}
AYLIK HARCAMA: {score_data['monthly_spent']:,.0f} TL
AYLIK BÜTÇE: {score_data['monthly_budget']:,.0f} TL

En çok harcanan kategoriler:
{chr(10).join([f"- {cat}: {data['total']:,.0f} TL" for cat, data in list(category_stats.items())[:3]])}

Raporu şu formatta ver:
🏅 AYLIK FİNANS RAPORU
Skor: {score_data['score']}/100
[2-3 cümle özet]

[Rozetler varsa listele]

💡 Gelecek Ay İçin 2 Öneri:
1. [öneri]
2. [öneri]
"""
    response = model.generate_content(prompt)
    steps = state.get("steps_taken", [])
    steps.append("reporting")

    return {
        **state,
        "final_response": response.text,
        "coach_response": response.text,
        "steps_taken": steps,
    }
