import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { logger } from '@sportsbook/logger'
import { connectDb } from '@sportsbook/db-client'
import betRoutes from './routes/bet'
import slipRoutes from './routes/slip'
import historyRoutes from './routes/history'

const PORT = Number(process.env.PORT ?? 3003)
process.env.SERVICE_NAME = 'betting-engine'

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true })
  await app.register(cors)
  await app.register(betRoutes, { prefix: '/api/bets' })
  await app.register(slipRoutes, { prefix: '/api/slips' })
  await app.register(historyRoutes, { prefix: '/api/history' })
  app.get('/health', async () => ({ status: 'ok', service: 'betting-engine' }))
  await connectDb()
  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'Betting engine started')
}
bootstrap().catch((err) => { logger.error(err); process.exit(1) })
