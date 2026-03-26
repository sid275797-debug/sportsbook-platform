import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { logger } from '@sportsbook/logger'
import { getRedis } from '@sportsbook/redis-client'
import { disconnectAll as disconnectKafka } from '@sportsbook/kafka-client'
import { FeedConsumer } from './feed-consumer/consumer'
import sportsRoutes from './routes/sports'
import fixtureRoutes from './routes/fixtures'
import marketRoutes from './routes/markets'
import cricketRoutes from './routes/cricket'

const PORT = Number(process.env.PORT ?? 3004)
process.env.SERVICE_NAME = 'market-service'

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true })
  await app.register(cors)
  await app.register(sportsRoutes, { prefix: '/api/sports' })
  await app.register(fixtureRoutes, { prefix: '/api/fixtures' })
  await app.register(marketRoutes, { prefix: '/api/markets' })
  await app.register(cricketRoutes, { prefix: '/api/cricket' })
  app.get('/health', async () => ({ status: 'ok', service: 'market-service' }))
  try { await getRedis().connect() } catch (err) { logger.warn({ err }, 'Redis failed') }
  try { const fc = new FeedConsumer(); await fc.start() } catch (err) { logger.warn({ err }, 'Feed consumer failed') }
  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'Market service started')
  const shutdown = async () => { await app.close(); await disconnectKafka(); process.exit(0) }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}
bootstrap().catch((err) => { logger.error(err); process.exit(1) })
