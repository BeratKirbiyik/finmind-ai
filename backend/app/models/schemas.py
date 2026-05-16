from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.sql import func
from sqlalchemy import Enum as SAEnum
import uuid
import enum
from app.database import Base

class CategoryEnum(str, enum.Enum):
    food = "food"
    transport = "transport"
    shopping = "shopping"
    bills = "bills"
    entertainment = "entertainment"
    health = "health"
    education = "education"
    other = "other"

class User(Base):
    __tablename__ = "users"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    monthly_income = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    category = Column(SAEnum(CategoryEnum), nullable=False)
    description = Column(String, nullable=False)
    merchant = Column(String)
    transaction_date = Column(DateTime(timezone=True), nullable=False)
    is_income = Column(Boolean, default=False)
    emotional_tag = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Goal(Base):
    __tablename__ = "goals"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime(timezone=True))
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class WeeklyReport(Base):
    __tablename__ = "weekly_reports"
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    week_start = Column(DateTime(timezone=True), nullable=False)
    score = Column(Integer, default=0)
    summary = Column(Text)
    badges_earned = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
