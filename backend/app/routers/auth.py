from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.schemas import User
import uuid

router = APIRouter()

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    monthly_income: float = 0.0

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    monthly_income: float

    class Config:
        from_attributes = True

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing = result.scalar_one_or_none()
    if existing:
        # Update name & income in case user is re-onboarding, return existing user
        existing.full_name = user_data.full_name
        existing.monthly_income = user_data.monthly_income
        await db.commit()
        await db.refresh(existing)
        return UserResponse(id=str(existing.id), email=existing.email,
                            full_name=existing.full_name, monthly_income=existing.monthly_income)
    user = User(
        id=uuid.uuid4(),
        email=user_data.email,
        full_name=user_data.full_name,
        monthly_income=user_data.monthly_income,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserResponse(id=str(user.id), email=user.email,
                        full_name=user.full_name, monthly_income=user.monthly_income)

@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(id=str(user.id), email=user.email, full_name=user.full_name, monthly_income=user.monthly_income)
