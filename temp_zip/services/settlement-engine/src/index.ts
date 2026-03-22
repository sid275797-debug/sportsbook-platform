import 'dotenv/config'
import { logger } from '@sportsbook/logger'
import { connectDb } from '@sportsbook/db-client'
import { SettlementConsumer } from './consumers/settlementConsumer'

process.env.SERVICE_NAME = 'settlement-engine'

async function bootstrap() {
  await connectDb()
  const consumer = new SettlementConsumer()
  await consumer.start()
  logger.info('Settlement engine started (event-driven, no HTTP server)')
}
bootstrap().catch((err) => { logger.error(err); process.exit(1) })
