import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.probability.engine import ProbabilityEngine
from src.pricing.pricer import OddsPricer
from src.trader_api.router import router as trader_router
from src.publishers.odds_publisher import OddsPublisher

app = FastAPI(title="Odds Engine", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(trader_router, prefix="/api/trader")

@app.get("/health")
async def health():
    return {"status": "ok", "service": "odds-engine"}

@app.get("/api/odds/{market_id}")
async def get_odds(market_id: str):
    pricer = OddsPricer()
    return {"success": True, "data": pricer.get_market_odds(market_id)}

@app.post("/api/odds/calculate")
async def calculate_odds(body: dict):
    engine = ProbabilityEngine()
    probability = engine.calculate(body)
    pricer = OddsPricer()
    odds = pricer.probability_to_odds(probability, margin=body.get("margin", 0.05))
    return {"success": True, "data": {"probability": probability, "odds": odds, "impliedOdds": 1 / probability}}

if __name__ == "__main__":
    uvicorn.run("src.main:app", host="0.0.0.0", port=3007, reload=True)
