from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.schemas import Transaction, User, Goal
from datetime import datetime, timedelta
import uuid
from typing import List
from collections import defaultdict

async def get_user_transactions(
    db: AsyncSession,
    user_id: str,
    days: int = 60
) -> List[dict]:
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(Transaction).where(
            and_(
                Transaction.user_id == uuid.UUID(user_id),
                Transaction.transaction_date >= since,
                Transaction.is_income == False
            )
        ).order_by(Transaction.transaction_date.desc())
    )
    txs = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "amount": t.amount,
            "category": t.category.value,
            "description": t.description,
            "merchant": t.merchant,
            "date": t.transaction_date.isoformat(),
            "day_of_week": t.transaction_date.strftime("%A"),
            "hour": t.transaction_date.hour,
        }
        for t in txs
    ]

async def get_user_info(db: AsyncSession, user_id: str) -> dict:
    result = await db.execute(
        select(User).where(User.id == uuid.UUID(user_id))
    )
    user = result.scalar_one_or_none()
    if not user:
        return {}
    return {
        "full_name": user.full_name,
        "monthly_income": user.monthly_income,
        "email": user.email,
    }

async def get_user_goals(db: AsyncSession, user_id: str) -> List[dict]:
    result = await db.execute(
        select(Goal).where(
            and_(Goal.user_id == uuid.UUID(user_id), Goal.is_completed == False)
        )
    )
    goals = result.scalars().all()
    return [
        {
            "id": str(g.id),
            "title": g.title,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "deadline": g.deadline.isoformat() if g.deadline else None,
            "progress_pct": round((g.current_amount / g.target_amount) * 100, 1) if g.target_amount > 0 else 0,
        }
        for g in goals
    ]

def compute_category_stats(transactions: List[dict]) -> dict:
    stats = defaultdict(lambda: {"total": 0.0, "count": 0, "items": []})
    for tx in transactions:
        cat = tx["category"]
        stats[cat]["total"] += tx["amount"]
        stats[cat]["count"] += 1
        stats[cat]["items"].append(tx["description"])
    return {
        cat: {
            "total": round(data["total"], 2),
            "count": data["count"],
            "avg": round(data["total"] / data["count"], 2),
            "top_items": data["items"][:3],
        }
        for cat, data in sorted(stats.items(), key=lambda x: -x[1]["total"])
    }

def detect_emotional_patterns(transactions: List[dict]) -> dict:
    """Stresli harcama günlerini tespit et — aynı günde 3+ işlem varsa işaret et"""
    daily = defaultdict(list)
    for tx in transactions:
        date_key = tx["date"][:10]
        daily[date_key].append(tx)

    stress_days = []
    for date, txs in daily.items():
        if len(txs) >= 3:
            daily_total = sum(t["amount"] for t in txs)
            stress_days.append({
                "date": date,
                "transaction_count": len(txs),
                "total_spent": round(daily_total, 2),
                "categories": list({t["category"] for t in txs}),
            })

    food_delivery_count = sum(
        1 for tx in transactions
        if tx.get("merchant") and any(
            kw in tx["merchant"].lower()
            for kw in ["yemeksepeti", "getir", "trendyol yemek"]
        )
    )

    return {
        "high_spend_days": sorted(stress_days, key=lambda x: -x["total_spent"])[:5],
        "food_delivery_count": food_delivery_count,
        "impulsive_risk": "high" if len(stress_days) >= 4 else "medium" if len(stress_days) >= 2 else "low",
    }
