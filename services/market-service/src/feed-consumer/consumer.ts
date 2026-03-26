import { createConsumer, subscribe } from '@sportsbook/kafka-client'
import { KAFKA_TOPICS, KafkaMessage } from '@sportsbook/shared-types'
import { createLogger } from '@sportsbook/logger'
import db from '../prisma'
import { setCache, CacheKeys } from '@sportsbook/redis-client'

const log = createLogger('feed-consumer')

export class FeedConsumer {
  async start() {
    const consumer = await createConsumer('market-service-feed')
    await subscribe(consumer, [
      KAFKA_TOPICS.FIXTURE_CREATED, KAFKA_TOPICS.FIXTURE_UPDATED,
      KAFKA_TOPICS.ODDS_UPDATED, KAFKA_TOPICS.LIVE_SCORE_UPDATED,
      KAFKA_TOPICS.MARKET_SETTLED,
    ], async (msg) => this.handle(msg))
    log.info('Feed consumer started')
  }

  async handle(msg: KafkaMessage) {
    log.debug({ topic: msg.topic }, 'Processing feed message')
    switch (msg.topic) {
      case KAFKA_TOPICS.FIXTURE_UPDATED:
        await this.handleFixtureUpdate(msg.value as any)
        break
      case KAFKA_TOPICS.ODDS_UPDATED:
        await this.handleOddsUpdate(msg.value as any)
        break
      case KAFKA_TOPICS.LIVE_SCORE_UPDATED:
        await this.handleLiveScore(msg.value as any)
        break
      case KAFKA_TOPICS.MARKET_SETTLED:
        await this.handleMarketSettled(msg.value as any)
        break
    }
  }

  private async handleFixtureUpdate(data: { fixtureId: string; status: string }) {
    await db.fixture.update({ where: { id: data.fixtureId }, data: { status: data.status } })
  }

  private async handleOddsUpdate(data: { outcomeId: string; marketId: string; newOdds: number; probability: number }) {
    await db.outcome.update({ where: { id: data.outcomeId }, data: { odds: data.newOdds, probability: data.probability } })
    // Invalidate cache
    const market = await db.market.findUnique({ where: { id: data.marketId }, include: { outcomes: true } })
    if (market) await setCache(CacheKeys.marketOdds(data.marketId), { outcomes: market.outcomes }, 30)
  }

  private async handleLiveScore(data: { fixtureId: string; score: unknown }) {
    await db.fixture.update({ where: { id: data.fixtureId }, data: { liveScore: data.score as any } })
  }

  private async handleMarketSettled(data: { marketId: string; winningOutcomeIds: string[] }) {
    await db.$transaction(async (tx: any) => {
      await tx.market.update({ where: { id: data.marketId }, data: { status: 'settled' } })
      for (const outcomeId of data.winningOutcomeIds) {
        await tx.outcome.update({ where: { id: outcomeId }, data: { result: true } })
      }
      const losers = await tx.outcome.findMany({ where: { marketId: data.marketId, id: { notIn: data.winningOutcomeIds } } })
      for (const loser of losers) {
        await tx.outcome.update({ where: { id: loser.id }, data: { result: false } })
      }
    })
  }
}
