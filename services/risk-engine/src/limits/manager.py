import redis
import os

r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

DEFAULT_DAILY_LIMIT = float(os.getenv("DEFAULT_DAILY_LIMIT", "100000"))
DEFAULT_SINGLE_BET_LIMIT = float(os.getenv("DEFAULT_SINGLE_BET_LIMIT", "50000"))

class LimitsManager:
    def check(self, user_id: str, stake: float) -> dict:
        # Single bet limit
        if stake > DEFAULT_SINGLE_BET_LIMIT:
            return {"approved": False, "reason": f"Single bet limit ₹{DEFAULT_SINGLE_BET_LIMIT:,.0f}"}

        # Daily limit
        daily_key = f"limits:daily:{user_id}"
        daily_total = float(r.get(daily_key) or 0)
        if daily_total + stake > DEFAULT_DAILY_LIMIT:
            return {"approved": False, "reason": f"Daily limit ₹{DEFAULT_DAILY_LIMIT:,.0f}"}

        r.incrbyfloat(daily_key, stake)
        r.expire(daily_key, 86400)
        return {"approved": True}

    def get_user_limits(self, user_id: str) -> dict:
        daily_used = float(r.get(f"limits:daily:{user_id}") or 0)
        return {"dailyLimit": DEFAULT_DAILY_LIMIT, "dailyUsed": daily_used, "remaining": DEFAULT_DAILY_LIMIT - daily_used}
