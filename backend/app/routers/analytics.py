from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.agents.tools import (
    get_user_transactions,
    get_user_info,
    compute_category_stats,
    detect_emotional_patterns,
)
from app.agents.reporting import calculate_monthly_score
from datetime import datetime, timedelta, timezone
from collections import defaultdict

router = APIRouter()

MONTH_NAMES = {
    "01": "Oca", "02": "Şub", "03": "Mar", "04": "Nis",
    "05": "May", "06": "Haz", "07": "Tem", "08": "Ağu",
    "09": "Eyl", "10": "Eki", "11": "Kas", "12": "Ara",
}

@router.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str, db: AsyncSession = Depends(get_db)):
    # Fetch last 6 months of transactions
    transactions = await get_user_transactions(db, user_id, days=180)
    user_info = await get_user_info(db, user_id)
    category_stats = compute_category_stats(transactions)
    patterns = detect_emotional_patterns(transactions)
    monthly_income = user_info.get("monthly_income", 0)
    score_data = calculate_monthly_score(transactions, monthly_income)

    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")
    prev_month = (now.replace(day=1) - timedelta(days=1)).strftime("%Y-%m")

    # Group by month
    monthly_spending: dict[str, float] = defaultdict(float)
    for tx in transactions:
        month_key = tx["date"][:7]  # YYYY-MM
        monthly_spending[month_key] += tx["amount"]

    monthly_chart = [
        {
            "month": MONTH_NAMES.get(month.split("-")[1], month.split("-")[1]),
            "month_key": month,
            "amount": round(amount, 2),
        }
        for month, amount in sorted(monthly_spending.items())
    ]

    # This month vs last month
    total_spent_this_month = round(monthly_spending.get(current_month, 0), 2)
    total_spent_prev_month = round(monthly_spending.get(prev_month, 0), 2)

    if total_spent_prev_month > 0:
        change_pct = round(
            (total_spent_this_month - total_spent_prev_month) / total_spent_prev_month * 100, 1
        )
    else:
        change_pct = 0

    category_chart = [
        {"name": _category_label(cat), "value": round(data["total"], 2), "key": cat}
        for cat, data in list(category_stats.items())[:6]
    ]

    return {
        "user": user_info,
        "summary": {
            "total_spent_this_month": total_spent_this_month,
            "total_spent_prev_month": total_spent_prev_month,
            "monthly_change_pct": change_pct,
            "monthly_income": monthly_income,
            "savings_this_month": round(monthly_income - total_spent_this_month, 2),
            "savings_rate_pct": round(
                ((monthly_income - total_spent_this_month) / monthly_income * 100), 1
            ) if monthly_income > 0 else 0,
            "transaction_count": len([t for t in transactions if t["date"][:7] == current_month]),
        },
        "monthly_score": score_data,
        "category_stats": category_stats,
        "category_chart": category_chart,
        "monthly_chart": monthly_chart,
        "behavioral": {
            "patterns": patterns,
            "financial_dna": _get_dna(
                patterns, total_spent_this_month, monthly_income, category_stats
            ),
        },
    }

def _category_label(cat: str) -> str:
    labels = {
        "food": "Yemek", "transport": "Ulaşım", "shopping": "Alışveriş",
        "bills": "Faturalar", "entertainment": "Eğlence",
        "health": "Sağlık", "education": "Eğitim", "other": "Diğer"
    }
    return labels.get(cat, cat)

def _get_dna(patterns, total_spent, income, category_stats):
    risk = patterns.get("impulsive_risk", "low")
    spending_rate = (total_spent / income * 100) if income > 0 else 0
    top_cats = list(category_stats.keys())[:2]
    if risk == "high" and spending_rate > 80:
        return {"type": "Anlık Karar Verici", "emoji": "⚡", "color": "#ef4444",
                "description": "Stres anlarında harcama yapma eğiliminiz yüksek."}
    elif spending_rate > 90:
        return {"type": "Bütçe Sınırında", "emoji": "⚠️", "color": "#f97316",
                "description": "Gelirinizin neredeyse tamamını harcıyorsunuz."}
    elif "food" in top_cats and "shopping" in top_cats:
        return {"type": "Yaşam Kalitesi Odaklı", "emoji": "✨", "color": "#8b5cf6",
                "description": "Yemek ve alışverişe öncelik veriyorsunuz."}
    else:
        return {"type": "Dengeli Harcayıcı", "emoji": "⚖️", "color": "#10b981",
                "description": "Harcama alışkanlıklarınız görece dengeli."}
