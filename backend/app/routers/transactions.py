from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, extract, delete
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, List
from app.database import get_db
from app.models.schemas import Transaction, CategoryEnum
import uuid

router = APIRouter()

class TransactionCreate(BaseModel):
    user_id: str
    amount: float
    category: CategoryEnum
    description: str
    merchant: Optional[str] = None
    transaction_date: datetime
    is_income: bool = False

class TransactionResponse(BaseModel):
    id: str
    amount: float
    category: str
    description: str
    merchant: Optional[str]
    transaction_date: datetime
    is_income: bool

    class Config:
        from_attributes = True

@router.post("/", response_model=TransactionResponse)
async def create_transaction(data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    tx = Transaction(
        id=uuid.uuid4(),
        user_id=uuid.UUID(data.user_id),
        amount=data.amount,
        category=data.category,
        description=data.description,
        merchant=data.merchant,
        transaction_date=data.transaction_date,
        is_income=data.is_income,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return TransactionResponse(
        id=str(tx.id), amount=tx.amount, category=tx.category.value,
        description=tx.description, merchant=tx.merchant,
        transaction_date=tx.transaction_date, is_income=tx.is_income
    )

@router.get("/user/{user_id}", response_model=List[TransactionResponse])
async def get_transactions(
    user_id: str,
    days: int = Query(default=30, le=365),
    db: AsyncSession = Depends(get_db)
):
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.user_id == uuid.UUID(user_id), Transaction.transaction_date >= since)
        ).order_by(Transaction.transaction_date.desc())
    )
    txs = result.scalars().all()
    return [TransactionResponse(
        id=str(t.id), amount=t.amount, category=t.category.value,
        description=t.description, merchant=t.merchant,
        transaction_date=t.transaction_date, is_income=t.is_income
    ) for t in txs]

@router.post("/seed/{user_id}")
async def seed_demo_data(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    30.000 TL gelirli, dengeli ve gerçekçi 4 aylık demo verisi.
    Aylık harcama ~19.500 TL → tasarruf oranı ~%35.
    format: (category, description, merchant, amount, is_income, days_ago)
    """
    uid = uuid.UUID(user_id)
    now = datetime.utcnow()

    # Clear existing data so seed is idempotent
    await db.execute(delete(Transaction).where(Transaction.user_id == uid))
    await db.commit()

    # ── GELİRLER (4 ay) ──────────────────────────────────────────────
    incomes = [
        (0,   "Mayıs maaşı",   "İşveren", 30000.0),
        (30,  "Nisan maaşı",   "İşveren", 30000.0),
        (60,  "Mart maaşı",    "İşveren", 30000.0),
        (90,  "Şubat maaşı",   "İşveren", 30000.0),
        (15,  "Freelance proje geliri", "Müşteri", 4500.0),
        (75,  "Freelance proje geliri", "Müşteri", 3200.0),
    ]

    for days_ago, desc, merchant, amount in incomes:
        db.add(Transaction(
            id=uuid.uuid4(), user_id=uid, amount=amount,
            category="other", description=desc, merchant=merchant,
            transaction_date=now - timedelta(days=days_ago), is_income=True,
        ))

    # ── HARCAMALAR ───────────────────────────────────────────────────
    # (category, description, merchant, amount, days_ago)
    expenses = [
        # ── MAYIS (0-29 gün) ──────────────────────────────
        # Yemek ~4.800 TL
        ("food",          "Migros haftalık market",        "Migros",        780.0,   2),
        ("food",          "Migros haftalık market",        "Migros",        840.0,  10),
        ("food",          "Migros haftalık market",        "Migros",        760.0,  18),
        ("food",          "Yemeksepeti – pizza",           "Yemeksepeti",   210.0,   3),
        ("food",          "Yemeksepeti – burger",          "Yemeksepeti",   195.0,   8),
        ("food",          "Yemeksepeti – sushi",           "Yemeksepeti",   340.0,  14),
        ("food",          "Starbucks kahve",               "Starbucks",     145.0,   1),
        ("food",          "Akşam yemeği – restoran",       "Nusret",        680.0,  20),
        ("food",          "A101 market",                   "A101",          270.0,  24),
        ("food",          "Fırın & pastane",               "Simit Sarayı",   95.0,   6),
        # Ulaşım ~2.800 TL
        ("transport",     "Benzin",                        "Shell",         950.0,   4),
        ("transport",     "Benzin",                        "Shell",         900.0,  22),
        ("transport",     "Uber – iş toplantısı",          "Uber",          185.0,   7),
        ("transport",     "İETT akbil yükleme",            "İETT",          200.0,  12),
        ("transport",     "Otopark – AVM",                 "Otopark",        75.0,  16),
        # Faturalar ~3.800 TL
        ("bills",         "Elektrik faturası",             "BEDAŞ",         680.0,  20),
        ("bills",         "Doğalgaz faturası",             "İGDAŞ",         520.0,  20),
        ("bills",         "İnternet – fiber",              "Turkcell",      399.0,  20),
        ("bills",         "Telefon faturası",              "Turkcell",      289.0,  20),
        ("bills",         "Aidat",                         "Site Yönetimi", 850.0,  20),
        ("bills",         "Su faturası",                   "İSKİ",          185.0,  20),
        # Alışveriş ~2.400 TL
        ("shopping",      "Trendyol – giysi",              "Trendyol",      760.0,   9),
        ("shopping",      "Kitap – D&R",                   "D&R",           320.0,  17),
        ("shopping",      "Ev ürünleri – IKEA",            "IKEA",          850.0,  25),
        ("shopping",      "Kozmetik – Sephora",            "Sephora",       470.0,  13),
        # Eğlence ~1.600 TL
        ("entertainment", "Netflix aboneliği",             "Netflix",        99.0,   1),
        ("entertainment", "Spotify aboneliği",             "Spotify",        59.0,   1),
        ("entertainment", "Sinema",                        "Cinemaximum",   240.0,  11),
        ("entertainment", "Konser bileti",                 "Biletix",       650.0,  19),
        ("entertainment", "Steam oyun",                    "Steam",         450.0,  27),
        # Sağlık ~1.500 TL
        ("health",        "Spor salonu üyeliği",           "MacFit",        750.0,   1),
        ("health",        "Eczane – vitamin takviyesi",    "Eczane",        340.0,  15),
        ("health",        "Diş hekimi kontrolü",           "Özel Klinik",   400.0,  23),
        # Eğitim ~600 TL
        ("education",     "Udemy kursu",                   "Udemy",         149.0,   5),
        ("education",     "İngilizce dersi",               "İngilizce Okulu", 450.0, 12),

        # ── NİSAN (30-59 gün) ─────────────────────────────
        ("food",          "Migros haftalık market",        "Migros",        810.0,  33),
        ("food",          "Migros haftalık market",        "Migros",        750.0,  41),
        ("food",          "Yemeksepeti – döner",           "Yemeksepeti",   175.0,  35),
        ("food",          "Yemeksepeti – pizza",           "Yemeksepeti",   220.0,  44),
        ("food",          "Akşam yemeği – restoran",       "Nusr-Et",       590.0,  50),
        ("food",          "Starbucks",                     "Starbucks",     130.0,  37),
        ("food",          "A101 market",                   "A101",          290.0,  55),
        ("transport",     "Benzin",                        "BP",            920.0,  38),
        ("transport",     "Benzin",                        "BP",            870.0,  55),
        ("transport",     "Uber",                          "Uber",          160.0,  42),
        ("transport",     "İETT akbil",                    "İETT",          200.0,  48),
        ("bills",         "Elektrik faturası",             "BEDAŞ",         640.0,  50),
        ("bills",         "Doğalgaz faturası",             "İGDAŞ",         490.0,  50),
        ("bills",         "İnternet – fiber",              "Turkcell",      399.0,  50),
        ("bills",         "Telefon faturası",              "Turkcell",      289.0,  50),
        ("bills",         "Aidat",                         "Site Yönetimi", 850.0,  50),
        ("shopping",      "Trendyol – ayakkabı",           "Trendyol",      890.0,  36),
        ("shopping",      "Hepsiburada – elektronik",      "Hepsiburada",  1250.0,  45),
        ("entertainment", "Netflix",                       "Netflix",        99.0,  31),
        ("entertainment", "Spotify",                       "Spotify",        59.0,  31),
        ("entertainment", "Bowling – arkadaşlarla",        "Bowling",       280.0,  40),
        ("health",        "Spor salonu",                   "MacFit",        750.0,  31),
        ("health",        "Eczane",                        "Eczane",        210.0,  46),
        ("education",     "Kitap – teknik",                "Amazon",        380.0,  53),

        # ── MART (60-89 gün) ──────────────────────────────
        ("food",          "Migros haftalık market",        "Migros",        820.0,  63),
        ("food",          "Migros haftalık market",        "Migros",        770.0,  72),
        ("food",          "Yemeksepeti",                   "Yemeksepeti",   195.0,  65),
        ("food",          "Yemeksepeti",                   "Yemeksepeti",   230.0,  78),
        ("food",          "Restoran",                      "Balıkçı",       480.0,  82),
        ("food",          "Market – BİM",                  "BİM",           310.0,  68),
        ("transport",     "Benzin",                        "Shell",         900.0,  66),
        ("transport",     "Benzin",                        "Shell",         850.0,  83),
        ("transport",     "Uber",                          "Uber",          145.0,  71),
        ("bills",         "Elektrik faturası",             "BEDAŞ",         710.0,  80),
        ("bills",         "Doğalgaz faturası",             "İGDAŞ",         580.0,  80),
        ("bills",         "İnternet",                      "Turkcell",      399.0,  80),
        ("bills",         "Telefon",                       "Turkcell",      289.0,  80),
        ("bills",         "Aidat",                         "Site Yönetimi", 850.0,  80),
        ("shopping",      "Trendyol",                      "Trendyol",      650.0,  70),
        ("shopping",      "Ev dekorasyon",                 "Zara Home",     980.0,  85),
        ("entertainment", "Netflix",                       "Netflix",        99.0,  61),
        ("entertainment", "Spotify",                       "Spotify",        59.0,  61),
        ("entertainment", "Tiyatro bileti",                "Biletix",       350.0,  74),
        ("health",        "Spor salonu",                   "MacFit",        750.0,  61),
        ("health",        "Vitamin & takviye",             "Eczane",        290.0,  76),
        ("education",     "Udemy kursu",                   "Udemy",         199.0,  88),

        # ── ŞUBAT (90-119 gün) ────────────────────────────
        ("food",          "Migros haftalık market",        "Migros",        790.0,  93),
        ("food",          "Migros haftalık market",        "Migros",        840.0, 101),
        ("food",          "Yemeksepeti",                   "Yemeksepeti",   210.0,  95),
        ("food",          "Restoran – sevgililer günü",    "Fine Dining",   920.0, 105),
        ("food",          "Market",                        "A101",          260.0,  98),
        ("transport",     "Benzin",                        "Shell",         880.0,  96),
        ("transport",     "Benzin",                        "BP",            840.0, 112),
        ("transport",     "Uber",                          "Uber",          175.0, 102),
        ("bills",         "Elektrik faturası",             "BEDAŞ",         590.0, 110),
        ("bills",         "Doğalgaz faturası",             "İGDAŞ",         720.0, 110),
        ("bills",         "İnternet",                      "Turkcell",      399.0, 110),
        ("bills",         "Telefon",                       "Turkcell",      289.0, 110),
        ("bills",         "Aidat",                         "Site Yönetimi", 850.0, 110),
        ("shopping",      "Sevgililer günü hediyesi",      "Vakko",        1200.0, 106),
        ("shopping",      "Trendyol",                      "Trendyol",      540.0,  99),
        ("entertainment", "Netflix",                       "Netflix",        99.0,  91),
        ("entertainment", "Spotify",                       "Spotify",        59.0,  91),
        ("entertainment", "Sinema",                        "Cinemaximum",   210.0, 104),
        ("health",        "Spor salonu",                   "MacFit",        750.0,  91),
        ("education",     "İngilizce kursu",               "British Side",  900.0, 100),
    ]

    for cat, desc, merchant, amount, days_ago in expenses:
        db.add(Transaction(
            id=uuid.uuid4(), user_id=uid, amount=amount,
            category=cat, description=desc, merchant=merchant,
            transaction_date=now - timedelta(days=days_ago), is_income=False,
        ))

    await db.commit()
    total = len(incomes) + len(expenses)
    return {"message": f"Demo verisi eklendi", "count": total, "income_count": len(incomes), "expense_count": len(expenses)}

@router.get("/monthly-summary/{user_id}")
async def get_monthly_summary(user_id: str, db: AsyncSession = Depends(get_db)):
    """Son 6 ayın aylık özeti"""
    result = await db.execute(
        select(
            extract('year', Transaction.transaction_date).label('year'),
            extract('month', Transaction.transaction_date).label('month'),
            func.sum(Transaction.amount).label('total'),
            func.count(Transaction.id).label('count')
        ).where(
            and_(
                Transaction.user_id == uuid.UUID(user_id),
                Transaction.is_income == False,
                Transaction.transaction_date >= datetime.utcnow() - timedelta(days=180)
            )
        ).group_by('year', 'month')
        .order_by('year', 'month')
    )
    rows = result.all()

    months_tr = ["", "Oca", "Şub", "Mar", "Nis", "May", "Haz",
                 "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]

    return [
        {
            "year": int(row.year),
            "month": int(row.month),
            "label": f"{months_tr[int(row.month)]} {int(row.year)}",
            "total": round(float(row.total), 2),
            "count": int(row.count),
        }
        for row in rows
    ]

@router.post("/bulk")
async def add_bulk_transactions(
    data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Birden fazla harcama ekle (aylık veri girişi için)"""
    user_id = data.get("user_id")
    transactions = data.get("transactions", [])
    month = data.get("month")

    if not user_id or not transactions:
        raise HTTPException(status_code=400, detail="user_id ve transactions gerekli")

    if month:
        year, mon = map(int, month.split("-"))
        base_date = datetime(year, mon, 15)
    else:
        base_date = datetime.utcnow()

    saved = []
    uid = uuid.UUID(user_id)
    for i, tx in enumerate(transactions):
        if not tx.get("amount") or float(tx.get("amount", 0)) <= 0:
            continue
        record = Transaction(
            id=uuid.uuid4(),
            user_id=uid,
            amount=float(tx["amount"]),
            category=tx.get("category", "other"),
            description=tx.get("description", "Harcama"),
            merchant=tx.get("merchant"),
            transaction_date=base_date - timedelta(days=i),
            is_income=tx.get("is_income", False),
        )
        db.add(record)
        saved.append(record.description)

    await db.commit()
    return {"success": True, "count": len(saved), "items": saved}
