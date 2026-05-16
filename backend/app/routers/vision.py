from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.models.schemas import Transaction
from app.config import settings
import google.generativeai as genai
import uuid
import json
import base64
from datetime import datetime

genai.configure(api_key=settings.gemini_api_key)
router = APIRouter()

VISION_PROMPT = """Bu görüntüde harcama/gider kayıtları var.
Tüm harcamaları tespit et ve JSON formatında döndür.

SADECE şu JSON formatını döndür, başka hiçbir şey yazma:
{
  "transactions": [
    {
      "description": "harcama açıklaması",
      "amount": 150.00,
      "category": "food",
      "merchant": "mağaza adı veya null"
    }
  ],
  "confidence": "high/medium/low",
  "note": "varsa ek not"
}

Kategori seçenekleri: food, transport, shopping, bills, entertainment, health, education, other
Türkçe açıklamalar kullan.
Eğer hiç harcama bulamazsan transactions listesini boş bırak."""


def _parse_response(text: str):
    raw = text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


@router.post("/extract")
async def extract_from_image(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    save: Optional[str] = Form("true"),
    db: AsyncSession = Depends(get_db),
):
    """Extract transactions from image. Pass save=false to only parse without saving to DB."""
    try:
        contents = await file.read()
        b64 = base64.b64encode(contents).decode("utf-8")
        mime = file.content_type or "image/jpeg"

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([
            {"mime_type": mime, "data": b64},
            VISION_PROMPT,
        ])

        parsed = _parse_response(response.text)
        transactions = parsed.get("transactions", [])

        result_txs = []
        for tx in transactions:
            if not tx.get("amount") or tx["amount"] <= 0:
                continue
            result_txs.append({
                "description": tx.get("description", "Görüntüden aktarıldı"),
                "amount": float(tx["amount"]),
                "category": tx.get("category", "other"),
                "merchant": tx.get("merchant"),
            })

        # Only persist when save=true (default)
        if save != "false" and result_txs:
            uid = uuid.UUID(user_id)
            for tx in result_txs:
                record = Transaction(
                    id=uuid.uuid4(),
                    user_id=uid,
                    amount=tx["amount"],
                    category=tx["category"],
                    description=tx["description"],
                    merchant=tx["merchant"],
                    transaction_date=datetime.utcnow(),
                    is_income=False,
                )
                db.add(record)
            await db.commit()

        return {
            "success": True,
            "extracted_count": len(result_txs),
            "transactions": result_txs,
            "confidence": parsed.get("confidence", "medium"),
            "note": parsed.get("note", ""),
        }

    except json.JSONDecodeError:
        return {"success": False, "error": "Görüntü analiz edilemedi. Lütfen daha net bir fotoğraf çekin.", "transactions": []}
    except Exception as e:
        return {"success": False, "error": str(e), "transactions": []}
