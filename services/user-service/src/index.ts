import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { logger } from '@sportsbook/logger'
import { connectDb } from '@sportsbook/db-client'
import { getRedis } from '@sportsbook/redis-client'
import authRoutes from './routes/auth'
import profileRoutes from './routes/profile'
import adminRoutes from './routes/admin'

const PORT = Number(process.env.PORT ?? 3001)
process.env.SERVICE_NAME = 'user-service'

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true })

  await app.register(cors, { origin: process.env.CORS_ORIGINS?.split(',') ?? '*' })
  await app.register(helmet)
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  app.addHook('onRequest', async (req) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request')
  })

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(profileRoutes, { prefix: '/api/profile' })
  await app.register(adminRoutes, { prefix: '/api/admin' })

  app.get('/health', async () => ({ status: 'ok', service: 'user-service', timestamp: new Date().toISOString() }))

  await connectDb()
  await getRedis().connect()

  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'User service started')
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start user service')
  process.exit(1)
})
