import pytest
from datetime import datetime, timedelta
from app.agents.tools import compute_category_stats, detect_emotional_patterns

def make_tx(category: str, amount: float, days_ago: int = 0, merchant: str = None):
    return {
        "id": "test-id",
        "amount": amount,
        "category": category,
        "description": f"{category} harcaması",
        "merchant": merchant,
        "date": (datetime.utcnow() - timedelta(days=days_ago)).isoformat(),
        "day_of_week": "Monday",
        "hour": 12,
    }

def test_compute_category_stats_empty():
    result = compute_category_stats([])
    assert result == {}

def test_compute_category_stats_single():
    txs = [make_tx("food", 100), make_tx("food", 200)]
    result = compute_category_stats(txs)
    assert "food" in result
    assert result["food"]["total"] == 300
    assert result["food"]["count"] == 2
    assert result["food"]["avg"] == 150

def test_compute_category_stats_multiple():
    txs = [
        make_tx("food", 500),
        make_tx("transport", 200),
        make_tx("shopping", 800),
    ]
    result = compute_category_stats(txs)
    keys = list(result.keys())
    assert keys[0] == "shopping"
    assert len(result) == 3

def test_detect_emotional_patterns_low_risk():
    txs = [make_tx("food", 100, days_ago=5)]
    result = detect_emotional_patterns(txs)
    assert result["impulsive_risk"] == "low"
    assert result["food_delivery_count"] == 0

def test_detect_emotional_patterns_high_risk():
    txs = [
        make_tx("food", 200, days_ago=1),
        make_tx("shopping", 300, days_ago=1),
        make_tx("entertainment", 150, days_ago=1),
        make_tx("food", 200, days_ago=2),
        make_tx("shopping", 300, days_ago=2),
        make_tx("entertainment", 150, days_ago=2),
        make_tx("food", 200, days_ago=3),
        make_tx("shopping", 300, days_ago=3),
        make_tx("entertainment", 150, days_ago=3),
        make_tx("food", 200, days_ago=4),
        make_tx("shopping", 300, days_ago=4),
        make_tx("entertainment", 150, days_ago=4),
    ]
    result = detect_emotional_patterns(txs)
    assert result["impulsive_risk"] == "high"
    assert len(result["high_spend_days"]) >= 4

def test_detect_food_delivery():
    txs = [
        make_tx("food", 150, merchant="Yemeksepeti"),
        make_tx("food", 120, merchant="Yemeksepeti"),
        make_tx("food", 90, merchant="Getir"),
    ]
    result = detect_emotional_patterns(txs)
    assert result["food_delivery_count"] == 3
