from app.agents.state import AgentState
from app.agents.tools import detect_emotional_patterns

async def behavioral_profiler_node(state: AgentState, db) -> AgentState:
    transactions = state.get("raw_transactions", [])
    patterns = detect_emotional_patterns(transactions)

    analysis = state.get("analysis", {})
    category_stats = analysis.get("category_stats", {})
    total_spent = analysis.get("total_spent", 0)
    monthly_income = analysis.get("user_info", {}).get("monthly_income", 0)

    spending_rate = (total_spent / (monthly_income * 2) * 100) if monthly_income > 0 else 0

    profile = {
        "emotional_patterns": patterns,
        "spending_rate_pct": round(spending_rate, 1),
        "financial_dna": _classify_dna(patterns, spending_rate, category_stats),
    }

    steps = state.get("steps_taken", [])
    steps.append("behavioral_profiler")

    return {**state, "behavioral_profile": profile, "steps_taken": steps}

def _classify_dna(patterns: dict, spending_rate: float, category_stats: dict) -> dict:
    risk = patterns.get("impulsive_risk", "low")
    top_cats = list(category_stats.keys())[:2]

    if risk == "high" and spending_rate > 80:
        profile_type = "Anlık Karar Verici"
        description = "Stres anlarında harcama yapma eğiliminiz yüksek. Soğuma süresi kuralı size çok yardımcı olur."
    elif spending_rate > 90:
        profile_type = "Bütçe Sınırında"
        description = "Gelirinizin neredeyse tamamını harcıyorsunuz. Acil tasarruf planı oluşturmanız önerilir."
    elif "food" in top_cats and "shopping" in top_cats:
        profile_type = "Yaşam Kalitesi Odaklı"
        description = "Yemek ve alışverişe öncelik veriyorsunuz. Bu harcamaları optimize ederek ciddi tasarruf yapabilirsiniz."
    else:
        profile_type = "Dengeli Harcayıcı"
        description = "Harcama alışkanlıklarınız görece dengeli. Küçük optimizasyonlarla hedeflerinize ulaşabilirsiniz."

    return {
        "type": profile_type,
        "description": description,
        "impulsive_risk": risk,
        "top_categories": top_cats,
    }
