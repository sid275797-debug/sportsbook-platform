import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.exposure.tracker import ExposureTracker
from src.fraud.detector import FraudDetector
from src.limits.manager import LimitsManager
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Risk Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

exposure = ExposureTracker()
fraud = FraudDetector()
limits = LimitsManager()

class BetCheckRequest(BaseModel):
    userId: str
    totalStake: float
    currency: str
    selections: List[dict]

class RiskResponse(BaseModel):
    approved: bool
    reason: Optional[str] = None
    riskScore: Optional[float] = None

@app.get("/health")
def health():
    return {"status": "ok", "service": "risk-engine"}

@app.post("/api/risk/check", response_model=RiskResponse)
async def check_bet(req: BetCheckRequest):
    # 1. Check user limits
    limit_check = limits.check(req.userId, req.totalStake)
    if not limit_check["approved"]:
        return RiskResponse(approved=False, reason=limit_check["reason"])

    # 2. Fraud detection
    fraud_score = fraud.score(req.userId, req.totalStake, req.selections)
    if fraud_score > 0.85:
        return RiskResponse(approved=False, reason="Suspicious activity detected", riskScore=fraud_score)

    # 3. Exposure check
    for sel in req.selections:
        exp = exposure.check(sel.get("marketId", ""), sel.get("outcomeId", ""), req.totalStake)
        if not exp["approved"]:
            return RiskResponse(approved=False, reason=f"Liability limit reached: {exp['reason']}")

    return RiskResponse(approved=True, riskScore=fraud_score)

@app.get("/api/risk/exposure/{market_id}")
async def get_exposure(market_id: str):
    return {"success": True, "data": exposure.get_market_exposure(market_id)}
