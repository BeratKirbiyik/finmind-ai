import pytest
from app.agents.tools import compute_category_stats

def test_category_stats_sorting():
    txs = [
        {"amount": 100, "category": "food", "description": "test",
         "merchant": None, "date": "2026-01-01", "day_of_week": "Mon", "hour": 12},
        {"amount": 500, "category": "shopping", "description": "test",
         "merchant": None, "date": "2026-01-01", "day_of_week": "Mon", "hour": 12},
        {"amount": 200, "category": "transport", "description": "test",
         "merchant": None, "date": "2026-01-01", "day_of_week": "Mon", "hour": 12},
    ]
    result = compute_category_stats(txs)
    keys = list(result.keys())
    assert keys[0] == "shopping"
    assert keys[1] == "transport"
    assert keys[2] == "food"

def test_category_stats_avg():
    txs = [
        {"amount": 100, "category": "food", "description": "t",
         "merchant": None, "date": "2026-01-01", "day_of_week": "Mon", "hour": 12},
        {"amount": 300, "category": "food", "description": "t",
         "merchant": None, "date": "2026-01-01", "day_of_week": "Mon", "hour": 12},
    ]
    result = compute_category_stats(txs)
    assert result["food"]["avg"] == 200.0
