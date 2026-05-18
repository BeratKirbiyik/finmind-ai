from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import and_
from app.database import get_db
from app.models.schemas import Transaction
from app.agents.tools import (
    get_user_transactions,
    get_user_info,
    compute_category_stats,
    detect_emotional_patterns,
)
from app.agents.reporting import calculate_monthly_score
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import uuid

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

@router.get("/forecast/{user_id}")
async def get_spending_forecast(user_id: str, db: AsyncSession = Depends(get_db)):
    import google.generativeai as genai
    from app.config import settings
    import json

    genai.configure(api_key=settings.gemini_api_key)

    since = datetime.utcnow() - timedelta(days=120)
    result = await db.execute(
        select(Transaction).where(
            and_(
                Transaction.user_id == uuid.UUID(user_id),
                Transaction.transaction_date >= since,
                Transaction.is_income == False
            )
        ).order_by(Transaction.transaction_date.asc())
    )
    transactions = result.scalars().all()

    if not transactions:
        return {"forecast": None, "message": "Yeterli veri yok"}

    monthly = defaultdict(float)
    monthly_cats = defaultdict(lambda: defaultdict(float))

    for tx in transactions:
        key = tx.transaction_date.strftime("%Y-%m")
        monthly[key] += tx.amount
        monthly_cats[key][tx.category.value] += tx.amount

    sorted_months = sorted(monthly.keys())[-3:]

    if len(sorted_months) < 2:
        return {"forecast": None, "message": "En az 2 aylık veri gerekli"}

    last_month = sorted_months[-1]
    year, mon = map(int, last_month.split("-"))
    if mon == 12:
        next_year, next_mon = year + 1, 1
    else:
        next_year, next_mon = year, mon + 1

    months_tr = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
                 "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]
    next_month_label = f"{months_tr[next_mon]} {next_year}"

    monthly_data = [
        {
            "month": m,
            "total": round(monthly[m], 2),
            "categories": {k: round(v, 2) for k, v in monthly_cats[m].items()}
        }
        for m in sorted_months
    ]

    totals = [monthly[m] for m in sorted_months]
    n = len(totals)
    weights = list(range(1, n + 1))
    weighted_avg = sum(t * w for t, w in zip(totals, weights)) / sum(weights)
    trend = (totals[-1] - totals[0]) / max(totals[0], 1) * 100

    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = f"""Son {n} aylık harcama verisi:
{chr(10).join([f"- {d['month']}: {d['total']:,.0f} TL" for d in monthly_data])}

Trend: %{trend:.1f} {'artış' if trend > 0 else 'azalış'}
Ağırlıklı ortalama: {weighted_avg:,.0f} TL

{next_month_label} için tahmini harcama ve kısa yorum yaz.
SADECE JSON döndür:
{{
  "predicted_amount": 15000,
  "confidence": "high",
  "trend": "increasing",
  "insight": "2-3 cümle Türkçe yorum",
  "warning": "varsa uyarı, yoksa null",
  "saving_tip": "bir tasarruf önerisi"
}}"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        gemini_data = json.loads(raw.strip())
    except Exception:
        gemini_data = {
            "predicted_amount": round(weighted_avg, 2),
            "confidence": "medium",
            "trend": "stable",
            "insight": f"Son {n} aylık veriye göre {next_month_label} tahmini hesaplandı.",
            "warning": None,
            "saving_tip": "Harcamalarınızı kategorize ederek tasarruf fırsatları bulun."
        }

    return {
        "forecast": {
            "next_month": next_month_label,
            "next_month_key": f"{next_year}-{str(next_mon).zfill(2)}",
            "predicted_amount": gemini_data.get("predicted_amount", round(weighted_avg, 2)),
            "confidence": gemini_data.get("confidence", "medium"),
            "trend": gemini_data.get("trend", "stable"),
            "insight": gemini_data.get("insight", ""),
            "warning": gemini_data.get("warning"),
            "saving_tip": gemini_data.get("saving_tip", ""),
            "historical": monthly_data,
        }
    }


@router.get("/carbon/{user_id}")
async def get_carbon_footprint(user_id: str, db: AsyncSession = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=30)
    result = await db.execute(
        select(Transaction).where(
            and_(
                Transaction.user_id == uuid.UUID(user_id),
                Transaction.transaction_date >= since,
                Transaction.is_income == False,
                Transaction.category.in_(["transport", "food"])
            )
        )
    )
    transactions = result.scalars().all()

    transport_spend = sum(t.amount for t in transactions if t.category.value == "transport")
    food_spend = sum(t.amount for t in transactions if t.category.value == "food")

    transport_co2 = (transport_spend / 1000) * 45
    food_co2 = (food_spend / 1000) * 30
    total_co2 = transport_co2 + food_co2

    turkey_avg = 350
    comparison_pct = round((total_co2 / turkey_avg) * 100, 1)
    trees_needed = round(total_co2 * 12 / 22, 1)

    level = "düşük" if total_co2 < 200 else "orta" if total_co2 < 350 else "yüksek"
    level_color = "#10b981" if level == "düşük" else "#f59e0b" if level == "orta" else "#ef4444"

    tips = []
    if transport_spend > 1000:
        tips.append("Toplu taşımaya geçiş ulaşım karbon ayak izinizi %60 azaltır")
    if food_spend > 3000:
        tips.append("Haftada 2 gün et tüketimini azaltmak yıllık ~120 kg CO2 tasarrufu sağlar")
    if not tips:
        tips.append("Karbon ayak iziniz Türkiye ortalamasının altında, tebrikler!")

    return {
        "carbon": {
            "total_co2_kg": round(total_co2, 1),
            "transport_co2_kg": round(transport_co2, 1),
            "food_co2_kg": round(food_co2, 1),
            "turkey_avg_kg": turkey_avg,
            "comparison_pct": comparison_pct,
            "trees_needed": trees_needed,
            "level": level,
            "level_color": level_color,
            "tips": tips,
            "period": "Son 30 gün",
        }
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
