import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { logger } from '@sportsbook/logger'
import { getRedis } from '@sportsbook/redis-client'
import walletRoutes from './routes/wallet'
import depositRoutes from './routes/deposit'
import withdrawalRoutes from './routes/withdrawal'
import adminRoutes from './routes/admin'
import internalRoutes from './routes/internal'

const PORT = Number(process.env.PORT ?? 3002)
process.env.SERVICE_NAME = 'wallet-service'

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true })
  await app.register(cors)
  await app.register(walletRoutes, { prefix: '/api/wallet' })
  await app.register(depositRoutes, { prefix: '/api/wallet/deposit' })
  await app.register(withdrawalRoutes, { prefix: '/api/wallet/withdrawal' })
  await app.register(adminRoutes, { prefix: '/api/admin/wallet' })
  await app.register(internalRoutes, { prefix: '/api/wallet/internal' })
  app.get('/health', async () => ({ status: 'ok', service: 'wallet-service' }))
  try { await getRedis().connect() } catch (err) { logger.warn({ err }, 'Redis failed') }
  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'Wallet service started')
}
bootstrap().catch((err) => { logger.error(err); process.exit(1) })