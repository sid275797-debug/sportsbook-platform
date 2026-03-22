import { createConsumer, subscribe } from '@sportsbook/kafka-client'
import { KAFKA_TOPICS, KafkaMessage } from '@sportsbook/shared-types'
import { createLogger } from '@sportsbook/logger'
import { PayoutCalculator } from '../calculators/payout'
import { SettlementResolver } from '../resolvers/resolver'

const log = createLogger('settlement-consumer')

export class SettlementConsumer {
  private resolver = new SettlementResolver()
  private calculator = new PayoutCalculator()

  async start() {
    const consumer = await createConsumer('settlement-engine')
    await subscribe(consumer, [KAFKA_TOPICS.MARKET_SETTLED], async (msg) => this.handle(msg))
    log.info('Settlement consumer listening')
  }

  async handle(msg: KafkaMessage) {
    const { marketId, winningOutcomeIds, fixtureId } = msg.value as any
    log.info({ marketId }, 'Processing settlement')
    try {
      await this.resolver.settleMarket(marketId, winningOutcomeIds, fixtureId)
    } catch (err) {
      log.error({ err, marketId }, 'Settlement failed')
    }
  }
}
