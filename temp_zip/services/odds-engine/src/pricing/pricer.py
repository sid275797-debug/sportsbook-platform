import redis
import json
import os
from typing import Optional, Dict, Any

r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

class OddsPricer:
    def probability_to_odds(self, probability: float, margin: float = 0.05) -> float:
        """Convert probability to decimal odds with margin."""
        if probability <= 0 or probability >= 1:
            raise ValueError("Probability must be between 0 and 1")
        adjusted_prob = probability * (1 + margin)
        odds = 1 / adjusted_prob
        return round(odds, 2)

    def odds_to_probability(self, odds: float) -> float:
        return round(1 / odds, 6)

    def apply_margin(self, probs: list[float], target_margin: float = 0.05) -> list[float]:
        """Scale probabilities to achieve target overround."""
        total = sum(probs)
        target_total = 1 + target_margin
        return [round(p * target_total / total, 6) for p in probs]

    def get_market_odds(self, market_id: str) -> Optional[Dict[str, Any]]:
        cached = r.get(f"odds:{market_id}")
        if cached:
            return json.loads(cached)
        return None

    def set_market_odds(self, market_id: str, odds_data: Dict[str, Any], ttl: int = 30):
        r.setex(f"odds:{market_id}", ttl, json.dumps(odds_data))
