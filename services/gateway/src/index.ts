import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import websocket from '@fastify/websocket'
import httpProxy from '@fastify/http-proxy'
import { logger } from '@sportsbook/logger'
import { authenticate } from '@sportsbook/auth-middleware'
import { loggingMiddleware } from './middleware/logging'

const PORT = Number(process.env.GATEWAY_PORT ?? 4000)
process.env.SERVICE_NAME = 'gateway'

const SERVICES = {
  user:       process.env.USER_SERVICE_URL       ?? 'http://localhost:3001',
  wallet:     process.env.WALLET_SERVICE_URL     ?? 'http://localhost:3002',
  betting:    process.env.BETTING_ENGINE_URL     ?? 'http://localhost:3003',
  market:     process.env.MARKET_SERVICE_URL     ?? 'http://localhost:3004',
  settlement: process.env.SETTLEMENT_ENGINE_URL  ?? 'http://localhost:3005',
  casino:     process.env.CASINO_ENGINE_URL      ?? 'http://localhost:3006',
  odds:       process.env.ODDS_ENGINE_URL        ?? 'http://localhost:3007',
  risk:       process.env.RISK_ENGINE_URL        ?? 'http://localhost:3008',
}

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true })

  await app.register(cors, {
    origin: process.env.CORS_ORIGINS?.split(',') ?? true,
    credentials: true,
  })
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' })
  await app.register(websocket)

  app.addHook('onRequest', loggingMiddleware)

  // ── Public routes (no auth required) ──
  await app.register(httpProxy, {
    upstream: SERVICES.user,
    prefix: '/api/auth',
    rewritePrefix: '/api/auth',
  })
  await app.register(httpProxy, {
    upstream: SERVICES.market,
    prefix: '/api/sports',
    rewritePrefix: '/api/sports',
  })
  await app.register(httpProxy, {
    upstream: SERVICES.market,
    prefix: '/api/fixtures',
    rewritePrefix: '/api/fixtures',
  })
  await app.register(httpProxy, {
    upstream: SERVICES.market,
    prefix: '/api/markets',
    rewritePrefix: '/api/markets',
  })
  await app.register(httpProxy, {
    upstream: SERVICES.market,
    prefix: '/api/cricket',
    rewritePrefix: '/api/cricket',
  })

  // ── Authenticated routes ──
  await app.register(httpProxy, {
    upstream: SERVICES.user,
    prefix: '/api/profile',
    rewritePrefix: '/api/profile',
    preHandler: authenticate,
  })
  await app.register(httpProxy, {
    upstream: SERVICES.wallet,
    prefix: '/api/wallet',
    rewritePrefix: '/api/wallet',
    preHandler: authenticate,
  })
  // NOTE: /api/wallet/internal is NOT proxied through the gateway.
  // Services (betting-engine, casino-engine) call wallet-service directly
  // via WALLET_SERVICE_URL env var to bypass auth and rate limiting.
  await app.register(httpProxy, {
    upstream: SERVICES.betting,
    prefix: '/api/bets',
    rewritePrefix: '/api/bets',
    preHandler: authenticate,
  })
  await app.register(httpProxy, {
    upstream: SERVICES.betting,
    prefix: '/api/slips',
    rewritePrefix: '/api/slips',
    preHandler: authenticate,
  })
  await app.register(httpProxy, {
    upstream: SERVICES.betting,
    prefix: '/api/history',
    rewritePrefix: '/api/history',
    preHandler: authenticate,
  })
  await app.register(httpProxy, {
    upstream: SERVICES.casino,
    prefix: '/api/casino',
    rewritePrefix: '/api/casino',
    preHandler: authenticate,
  })

  // ── Admin routes ──
  await app.register(httpProxy, {
    upstream: SERVICES.user,
    prefix: '/api/admin',
    rewritePrefix: '/api/admin',
    preHandler: authenticate,
  })
  await app.register(httpProxy, {
    upstream: SERVICES.odds,
    prefix: '/api/trader',
    rewritePrefix: '/api/trader',
    preHandler: authenticate,
  })

  // ── Health check ──
  app.get('/health', async () => ({
    status: 'ok',
    service: 'gateway',
    timestamp: new Date().toISOString(),
    upstreams: SERVICES,
  }))

  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'API Gateway started')
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start gateway')
  process.exit(1)
})
