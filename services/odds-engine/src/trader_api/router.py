from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class OddsOverrideRequest(BaseModel):
    market_id: str
    outcome_id: str
    new_odds: float
    reason: str

@router.post("/override")
async def override_odds(req: OddsOverrideRequest):
    if req.new_odds < 1.01 or req.new_odds > 1000:
        raise HTTPException(400, "Odds must be between 1.01 and 1000")
    return {"success": True, "data": {"marketId": req.market_id, "newOdds": req.new_odds}}

@router.get("/markets/{market_id}")
async def get_trader_view(market_id: str):
    return {"success": True, "data": {"marketId": market_id}}
