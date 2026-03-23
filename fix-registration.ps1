# fix-registration.ps1
# Run from: C:\Users\VCOM\Desktop\fixed\sportsbook-fixed
# Usage: .\fix-registration.ps1

$root = "C:\Users\VCOM\Desktop\fixed\sportsbook-fixed"

Write-Host "Applying auth controller fix..." -ForegroundColor Cyan

$auth = @"
import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { setCache, getCache, deleteCache, CacheKeys } from '@sportsbook/redis-client'
import { signToken, signRefreshToken, verifyRefreshToken } from '@sportsbook/auth-middleware'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('auth-controller')
const db = new PrismaClient()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export class AuthController {
  async register(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = registerSchema.safeParse(req.body)
      if (!result.success) {
        return reply.status(400).send({ success: false, error: result.error.flatten() })
      }

      const { email, password, username, phone, referralCode } = result.data

      const existing = await db.user.findFirst({ where: { OR: [{ email }, { username }] } })
      if (existing) {
        return reply.status(409).send({ success: false, error: 'Email or username already taken' })
      }

      const passwordHash = await bcrypt.hash(password, 12)
      const user = await db.user.create({
        data: {
          email, username, passwordHash, phone,
          referralCode: username.toLowerCase() + Math.random().toString(36).slice(2, 6),
          referredBy: referralCode,
        },
      })

      const accessToken = signToken({ userId: user.id, email: user.email, role: user.role as any })
      const refreshToken = signRefreshToken(user.id)

      await db.session.create({
        data: {
          userId: user.id, refreshToken,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] ?? '',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      setImmediate(async () => {
        try {
          const { createProducer, publish } = await import('@sportsbook/kafka-client')
          const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
          const producer = await createProducer()
          await publish(producer, KAFKA_TOPICS.USER_REGISTERED, user.id, {
            userId: user.id, email: user.email, username: user.username,
          })
          await producer.disconnect()
        } catch (err) {
          log.warn({ err }, 'Failed to publish user registered event')
        }
      })

      log.info({ userId: user.id }, 'User registered')
      return reply.status(201).send({
        success: true,
        data: {
          accessToken, refreshToken,
          user: { id: user.id, email: user.email, username: user.username, role: user.role }
        }
      })
    } catch (err: any) {
      log.error({ err }, 'Register error')
      return reply.status(500).send({ success: false, error: err.message })
    }
  }

  async login(req: FastifyRequest, reply: FastifyReply) {
    try {
      const result = loginSchema.safeParse(req.body)
      if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })

      const { email, password } = result.data
      const user = await db.user.findUnique({ where: { email } })
      if (!user || !user.isActive) return reply.status(401).send({ success: false, error: 'Invalid credentials' })

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) return reply.status(401).send({ success: false, error: 'Invalid credentials' })

      const accessToken = signToken({ userId: user.id, email: user.email, role: user.role as any })
      const refreshToken = signRefreshToken(user.id)

      await db.session.create({
        data: {
          userId: user.id, refreshToken,
          ipAddress: req.ip, userAgent: req.headers['user-agent'] ?? '',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      })

      await setCache(CacheKeys.user(user.id), user, 3600)
      log.info({ userId: user.id }, 'User logged in')
      return reply.send({ success: true, data: { accessToken, refreshToken } })
    } catch (err: any) {
      log.error({ err }, 'Login error')
      return reply.status(500).send({ success: false, error: err.message })
    }
  }

  async refreshToken(req: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = req.body as { refreshToken: string }
    if (!refreshToken) return reply.status(400).send({ success: false, error: 'Refresh token required' })
    try {
      const { userId } = verifyRefreshToken(refreshToken)
      const session = await db.session.findUnique({ where: { refreshToken }, include: { user: true } })
      if (!session || session.expiresAt < new Date()) {
        return reply.status(401).send({ success: false, error: 'Invalid refresh token' })
      }
      const newAccessToken = signToken({ userId: session.user.id, email: session.user.email, role: session.user.role as any })
      const newRefreshToken = signRefreshToken(userId)
      await db.session.update({
        where: { id: session.id },
        data: { refreshToken: newRefreshToken, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      })
      return reply.send({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } })
    } catch {
      return reply.status(401).send({ success: false, error: 'Invalid refresh token' })
    }
  }

  async logout(req: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = req.body as { refreshToken: string }
    if (refreshToken) await db.session.deleteMany({ where: { refreshToken } })
    if (req.user) await deleteCache(CacheKeys.user(req.user.userId))
    return reply.send({ success: true, message: 'Logged out' })
  }

  async sendOtp(req: FastifyRequest, reply: FastifyReply) {
    const { phone } = req.body as { phone: string }
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    await setCache('otp:' + phone, otp, 300)
    return reply.send({ success: true, message: 'OTP sent' })
  }

  async verifyOtp(req: FastifyRequest, reply: FastifyReply) {
    const { phone, otp } = req.body as { phone: string; otp: string }
    const stored = await getCache<string>('otp:' + phone)
    if (!stored || stored !== otp) return reply.status(400).send({ success: false, error: 'Invalid OTP' })
    await deleteCache('otp:' + phone)
    return reply.send({ success: true, message: 'OTP verified' })
  }

  async me(req: FastifyRequest, reply: FastifyReply) {
    const cached = await getCache(CacheKeys.user(req.user!.userId))
    if (cached) return reply.send({ success: true, data: cached })
    const user = await db.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, username: true, phone: true, role: true, kycStatus: true, createdAt: true }
    })
    if (!user) return reply.status(404).send({ success: false, error: 'User not found' })
    await setCache(CacheKeys.user(user.id), user, 3600)
    return reply.send({ success: true, data: user })
  }
}
"@

$index = @"
import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { logger } from '@sportsbook/logger'
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

  try {
    await getRedis().connect()
  } catch (err) {
    logger.warn({ err }, 'Redis connection failed - continuing without cache')
  }

  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'User service started')
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start user service')
  process.exit(1)
})
"@

[System.IO.File]::WriteAllText(
  "$root\services\user-service\src\controllers\auth.ts",
  $auth,
  [System.Text.Encoding]::UTF8
)
Write-Host "auth.ts written" -ForegroundColor Green

[System.IO.File]::WriteAllText(
  "$root\services\user-service\src\index.ts",
  $index,
  [System.Text.Encoding]::UTF8
)
Write-Host "index.ts written" -ForegroundColor Green

Write-Host ""
Write-Host "Now run in Terminal 1:" -ForegroundColor Yellow
Write-Host "  cd $root\services\user-service && npx tsx src/index.ts"
Write-Host ""
Write-Host "Run in Terminal 2:" -ForegroundColor Yellow
Write-Host "  cd $root\services\gateway && npx tsx src/index.ts"
Write-Host ""
Write-Host "Test in Terminal 3:" -ForegroundColor Yellow
Write-Host '  Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" -Method POST -ContentType "application/json" -Body "{""username"":""test3"",""email"":""test3@gmail.com"",""password"":""Test1234!""}"'
