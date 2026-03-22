import redis
import json
import os
from src.connectors.betfair import BetfairConnector

r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
HEDGE_THRESHOLD = float(os.getenv("HEDGE_THRESHOLD", "100000"))

class HedgingEngine:
    def __init__(self):
        self.betfair = BetfairConnector()

    def should_hedge(self, market_id: str, outcome_id: str, additional_liability: float) -> bool:
        key = f"exposure:outcome:{outcome_id}"
        current = float(r.get(key) or 0)
        return current + additional_liability > HEDGE_THRESHOLD

    def calculate_hedge_amount(self, liability: float, current_exposure: float) -> float:
        """How much to lay on exchange to cap liability."""
        excess = current_exposure - HEDGE_THRESHOLD
        if excess <= 0:
            return 0.0
        return round(excess * 0.8, 2)  # Hedge 80% of excess

    async def hedge_if_needed(self, market_id: str, outcome_id: str, betfair_market_id: str, selection_id: int):
        key = f"exposure:outcome:{outcome_id}"
        exposure = float(r.get(key) or 0)
        if exposure > HEDGE_THRESHOLD:
            amount = self.calculate_hedge_amount(exposure, exposure)
            if amount > 0:
                try:
                    result = self.betfair.place_lay_bet(betfair_market_id, selection_id, price=2.0, size=amount)
                    print(f"Hedged {amount} on {outcome_id}: {result}")
                except Exception as e:
                    print(f"Hedge failed: {e}")
