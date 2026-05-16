from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, delete
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional, List
from app.database import get_db
from app.models.schemas import Goal
import uuid

router = APIRouter()

class GoalCreate(BaseModel):
    user_id: str
    title: str
    target_amount: float
    current_amount: float = 0.0
    deadline: Optional[datetime] = None

class GoalResponse(BaseModel):
    id: str
    title: str
    target_amount: float
    current_amount: float
    deadline: Optional[datetime]
    progress_pct: float
    days_remaining: Optional[int]

    class Config:
        from_attributes = True

@router.post("/", response_model=GoalResponse)
async def create_goal(data: GoalCreate, db: AsyncSession = Depends(get_db)):
    goal = Goal(
        id=uuid.uuid4(),
        user_id=uuid.UUID(data.user_id),
        title=data.title,
        target_amount=data.target_amount,
        current_amount=data.current_amount,
        deadline=data.deadline,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return _to_response(goal)

@router.get("/user/{user_id}", response_model=List[GoalResponse])
async def get_goals(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Goal).where(
            and_(Goal.user_id == uuid.UUID(user_id), Goal.is_completed == False)
        )
    )
    goals = result.scalars().all()
    return [_to_response(g) for g in goals]

@router.patch("/{goal_id}/deposit")
async def deposit_to_goal(goal_id: str, amount: float, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Goal).where(Goal.id == uuid.UUID(goal_id)))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Hedef bulunamadı")
    goal.current_amount = min(goal.current_amount + amount, goal.target_amount)
    if goal.current_amount >= goal.target_amount:
        goal.is_completed = True
    await db.commit()
    await db.refresh(goal)
    return _to_response(goal)

@router.post("/seed/{user_id}")
async def seed_goals(user_id: str, db: AsyncSession = Depends(get_db)):
    demo_goals = [
        ("Yaz Tatili", 15000, 3200, "2026-08-01"),
        ("Acil Fon", 30000, 8500, "2026-12-31"),
        ("Laptop", 25000, 12000, "2026-06-01"),
    ]
    uid = uuid.UUID(user_id)
    await db.execute(delete(Goal).where(Goal.user_id == uid))
    await db.commit()
    for title, target, current, deadline in demo_goals:
        goal = Goal(
            id=uuid.uuid4(),
            user_id=uid,
            title=title,
            target_amount=target,
            current_amount=current,
            deadline=datetime.fromisoformat(deadline),
        )
        db.add(goal)
    await db.commit()
    return {"message": "Demo hedefler eklendi", "count": len(demo_goals)}

def _to_response(g: Goal) -> GoalResponse:
    progress = round((g.current_amount / g.target_amount) * 100, 1) if g.target_amount > 0 else 0
    days_remaining = None
    if g.deadline:
        delta = g.deadline - datetime.now(timezone.utc)
        days_remaining = max(0, delta.days)
    return GoalResponse(
        id=str(g.id),
        title=g.title,
        target_amount=g.target_amount,
        current_amount=g.current_amount,
        deadline=g.deadline,
        progress_pct=progress,
        days_remaining=days_remaining,
    )
