import { getCache, CacheKeys } from '@sportsbook/redis-client'
import axios from 'axios'

export class OddsValidator {
  async validateOdds(marketId: string, outcomeId: string, requestedOdds: number): Promise<boolean> {
    const cached = await getCache<{ outcomes: Array<{ id: string; odds: number }> }>(CacheKeys.marketOdds(marketId))
    const currentOdds = cached?.outcomes.find((o) => o.id === outcomeId)?.odds

    if (!currentOdds) {
      // Fetch from market service
      try {
        const { data } = await axios.get(`${process.env.MARKET_SERVICE_URL}/api/markets/${marketId}`)
        const outcome = data?.data?.outcomes?.find((o: any) => o.id === outcomeId)
        if (!outcome) return false
        return Math.abs(outcome.odds - requestedOdds) / requestedOdds <= 0.02 // 2% tolerance
      } catch { return false }
    }

    return Math.abs(currentOdds - requestedOdds) / currentOdds <= 0.02
  }
}
