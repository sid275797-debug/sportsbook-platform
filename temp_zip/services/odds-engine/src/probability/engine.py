import numpy as np
from typing import Dict, Any

class ProbabilityEngine:
    """Converts model inputs into win probabilities for each outcome."""

    def calculate(self, market_data: Dict[str, Any]) -> float:
        """Simple Elo-based probability for sports markets."""
        home_elo = market_data.get("homeElo", 1500)
        away_elo = market_data.get("awayElo", 1500)
        home_advantage = market_data.get("homeAdvantage", 50)

        expected = 1 / (1 + 10 ** ((away_elo - home_elo - home_advantage) / 400))
        return round(float(expected), 6)

    def calculate_draw_probability(self, home_prob: float, away_prob: float) -> float:
        """Estimate draw probability from home/away probs."""
        return max(0.05, 1 - home_prob - away_prob)

    def apply_juice(self, probability: float, juice: float = 0.05) -> float:
        """Add house edge (juice/vig) to probability."""
        return min(probability + juice * probability, 0.99)
