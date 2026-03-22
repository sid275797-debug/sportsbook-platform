import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import websocket from '@fastify/websocket'
import { logger } from '@sportsbook/logger'
import { connectDb } from '@sportsbook/db-client'
import { CrashGame } from './games/crash/crashGame'
import crashRoutes from './routes/crash'
import diceRoutes from './routes/dice'
import rouletteRoutes from './routes/roulette'
import { wsHandler } from './websocket/handler'

const PORT = Number(process.env.PORT ?? 3006)
process.env.SERVICE_NAME = 'casino-engine'

async function bootstrap() {
  const app = Fastify({ logger: false })
  await app.register(cors)
  await app.register(websocket)
  await app.register(crashRoutes, { prefix: '/api/casino/crash' })
  await app.register(diceRoutes, { prefix: '/api/casino/dice' })
  await app.register(rouletteRoutes, { prefix: '/api/casino/roulette' })

  app.get('/ws', { websocket: true }, wsHandler)
  app.get('/health', async () => ({ status: 'ok', service: 'casino-engine' }))

  await connectDb()

  // Start crash game loop
  const crash = new CrashGame()
  crash.start()

  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'Casino engine started')
}
bootstrap().catch((err) => { logger.error(err); process.exit(1) })
