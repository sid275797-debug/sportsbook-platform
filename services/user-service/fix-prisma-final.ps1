# fix-prisma-final.ps1
# Run from: C:\Users\VCOM\Desktop\fixed\sportsbook-fixed\services\user-service

$svcRoot = "C:\Users\VCOM\Desktop\fixed\sportsbook-fixed\services\user-service"

# Step 1: Verify the correct prisma client is at node_modules/.prisma/client
Write-Host "Checking local prisma client models..." -ForegroundColor Cyan
Push-Location $svcRoot
$models = node -e "const {PrismaClient} = require('./node_modules/.prisma/client'); const db = new PrismaClient(); console.log(Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')).join(', '))"
Write-Host "Local .prisma/client models: $models" -ForegroundColor Yellow
Pop-Location

# Step 2: Write a prisma.ts singleton that requires from the exact local path
$prismaHelper = @"
// This file uses require() with an explicit path to bypass pnpm symlink resolution
// which was pointing to the wrong service's generated Prisma client.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../node_modules/.prisma/client')

const globalForPrisma = globalThis as any

export const db: any = globalForPrisma.db ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
    : [{ emit: 'stdout', level: 'error' }],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.db = db

export default db
"@

[System.IO.File]::WriteAllText(
  "$svcRoot\src\prisma.ts",
  $prismaHelper,
  [System.Text.Encoding]::UTF8
)
Write-Host "src/prisma.ts written" -ForegroundColor Green

# Step 3: Write auth controller importing from ./prisma instead of @prisma/client
$auth = @"
import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import db from './prisma'
import { setCache, getCache, deleteCache, CacheKeys } from '@sportsbook/redis-client'
import { signToken, signRefreshToken, verifyRefreshToken } from '@sportsbook/auth-middleware'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('auth-controller')

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

      const accessToken = signToken({ userId: user.id, email: user.email, role: user.role })
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

      const accessToken = signToken({ userId: user.id, email: user.email, role: user.role })
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
      const newAccessToken = signToken({ userId: session.user.id, email: session.user.email, role: session.user.role })
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

[System.IO.File]::WriteAllText(
  "$svcRoot\src\controllers\auth.ts",
  $auth,
  [System.Text.Encoding]::UTF8
)
Write-Host "src/controllers/auth.ts written" -ForegroundColor Green

Write-Host ""
Write-Host "All done! Now:" -ForegroundColor Green
Write-Host "1. Kill existing node: Get-NetTCPConnection -LocalPort 3001,4000 -State Listen | ForEach-Object { taskkill /PID `$_.OwningProcess /F }"
Write-Host "2. Terminal 1: cd $svcRoot && npx tsx src/index.ts"
Write-Host "3. Terminal 2: cd C:\Users\VCOM\Desktop\fixed\sportsbook-fixed\services\gateway && npx tsx src/index.ts"
Write-Host "4. Test: Invoke-RestMethod -Uri 'http://localhost:3001/api/auth/register' -Method POST -ContentType 'application/json' -Body '{`"username`":`"test5`",`"email`":`"test5@gmail.com`",`"password`":`"Test1234!`"}'"
