import axios from 'axios'
import { createLogger } from '@sportsbook/logger'
import { createProducer, publish } from '@sportsbook/kafka-client'
import { KAFKA_TOPICS } from '@sportsbook/shared-types'
import { PayoutCalculator } from '../calculators/payout'

const log = createLogger('settlement-resolver')
const calculator = new PayoutCalculator()

export class SettlementResolver {
  async settleMarket(marketId: string, winningOutcomeIds: string[], fixtureId: string) {
    // 1. Get all bets for this market from betting engine
    const { data } = await axios.get(`${process.env.BETTING_ENGINE_URL}/api/bets/internal/by-market/${marketId}`)
    const bets = data?.data ?? []

    log.info({ marketId, betCount: bets.length }, 'Settling bets')

    // 2. Settle each bet
    for (const bet of bets) {
      try {
        await axios.post(`${process.env.BETTING_ENGINE_URL}/api/bets/internal/settle`, {
          betSlipId: bet.id, winningOutcomeIds,
        })
      } catch (err) {
        log.error({ err, betSlipId: bet.id }, 'Failed to settle individual bet')
      }
    }

    log.info({ marketId }, 'Market settled')
  }
}
