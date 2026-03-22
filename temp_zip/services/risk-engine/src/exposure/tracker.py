import redis
import json
import os

r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

MAX_EXPOSURE_PER_OUTCOME = float(os.getenv("MAX_EXPOSURE_PER_OUTCOME", "500000"))
MAX_EXPOSURE_PER_MARKET = float(os.getenv("MAX_EXPOSURE_PER_MARKET", "2000000"))

class ExposureTracker:
    def check(self, market_id: str, outcome_id: str, stake: float) -> dict:
        outcome_key = f"exposure:outcome:{outcome_id}"
        market_key = f"exposure:market:{market_id}"

        outcome_exposure = float(r.get(outcome_key) or 0)
        market_exposure = float(r.get(market_key) or 0)

        if outcome_exposure + stake > MAX_EXPOSURE_PER_OUTCOME:
            return {"approved": False, "reason": f"Outcome exposure limit (₹{MAX_EXPOSURE_PER_OUTCOME:,.0f})"}
        if market_exposure + stake > MAX_EXPOSURE_PER_MARKET:
            return {"approved": False, "reason": f"Market exposure limit (₹{MAX_EXPOSURE_PER_MARKET:,.0f})"}

        r.incrbyfloat(outcome_key, stake)
        r.expire(outcome_key, 86400)
        r.incrbyfloat(market_key, stake)
        r.expire(market_key, 86400)

        return {"approved": True}

    def get_market_exposure(self, market_id: str) -> dict:
        key = f"exposure:market:{market_id}"
        return {"marketId": market_id, "totalExposure": float(r.get(key) or 0), "limit": MAX_EXPOSURE_PER_MARKET}

    def release(self, outcome_id: str, stake: float):
        r.incrbyfloat(f"exposure:outcome:{outcome_id}", -stake)
