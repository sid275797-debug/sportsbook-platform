import { getCache, CacheKeys } from '@sportsbook/redis-client'
import axios from 'axios'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('odds-validator')
const MARKET_URL = process.env.MARKET_SERVICE_URL ?? 'http://localhost:3004'
const TOLERANCE = 0.05 // 5% tolerance â€” more forgiving in dev

export class OddsValidator {
  async validateOdds(marketId: string, outcomeId: string, requestedOdds: number): Promise<boolean> {
    // 1. Try Redis cache first
    try {
      const cached = await getCache<{ outcomes: Array<{ id: string; odds: number }> }>(
        CacheKeys.marketOdds(marketId)
      )
      if (cached?.outcomes) {
        const current = cached.outcomes.find((o) => o.id === outcomeId)
        if (current) {
          const diff = Math.abs(Number(current.odds) - requestedOdds) / requestedOdds
          return diff <= TOLERANCE
        }
      }
    } catch { /* redis unavailable */ }

    // 2. Try market-service HTTP
    try {
      const { data } = await axios.get(MARKET_URL + '/api/markets/' + marketId, { timeout: 2000 })
      const outcome = data?.data?.outcomes?.find((o: any) => o.id === outcomeId)
      if (outcome) {
        const diff = Math.abs(Number(outcome.odds) - requestedOdds) / requestedOdds
        return diff <= TOLERANCE
      }
      // Outcome not found in market â€” reject
      return false
    } catch (err) {
      // Market service unreachable â€” allow bet (fail open)
      log.warn({ marketId, outcomeId }, 'Market service unreachable during odds validation â€” allowing bet')
      return true
    }
  }
}