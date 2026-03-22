import redis
import os
from typing import List, Dict, Any

r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

class FraudDetector:
    def score(self, user_id: str, stake: float, selections: List[Dict[str, Any]]) -> float:
        score = 0.0
        # Velocity check - too many bets in short window
        bet_count_key = f"fraud:velocity:{user_id}"
        count = r.incr(bet_count_key)
        r.expire(bet_count_key, 60)  # 1 minute window
        if count > 20: score += 0.4

        # Large stake check
        if stake > 100000: score += 0.2

        # Arbitrage detection - multiple selections across markets
        market_ids = {s.get("marketId") for s in selections}
        if len(market_ids) > 5: score += 0.2

        # Perfect odds pattern (always betting at peak value)
        max_odds = max((s.get("odds", 1) for s in selections), default=1)
        if max_odds > 50: score += 0.3

        return min(score, 1.0)
