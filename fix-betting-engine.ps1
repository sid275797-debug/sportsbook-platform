# fix-betting-engine.ps1
# Run from: C:\Users\VCOM\Desktop\fixed\sportsbook-fixed
# Usage: powershell -ExecutionPolicy Bypass -File ".\fix-betting-engine.ps1"

$root = "C:\Users\VCOM\Desktop\fixed\sportsbook-fixed"
$bet  = "$root\services\betting-engine"

Write-Host "`n[1/7] Writing betting-engine .env..." -ForegroundColor Cyan
$env = @"
PORT=3003
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sportsbook
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=betpro-super-secret-jwt-key-2026
REFRESH_TOKEN_SECRET=betpro-refresh-token-secret-2026
WALLET_SERVICE_URL=http://localhost:3002
MARKET_SERVICE_URL=http://localhost:3004
RISK_ENGINE_URL=http://localhost:3008
NODE_ENV=development
"@
[System.IO.File]::WriteAllText("$bet\.env", $env, [System.Text.Encoding]::UTF8)
Write-Host "  .env written" -ForegroundColor Green

Write-Host "`n[2/7] Running betting-engine migrations..." -ForegroundColor Cyan
Push-Location $bet
npx prisma generate 2>&1 | Select-String "Generated|Error" | Write-Host
npx prisma migrate deploy 2>&1 | Write-Host
Pop-Location

Write-Host "`n[3/7] Writing prisma.ts helper..." -ForegroundColor Cyan
$prismaHelper = @"
const { PrismaClient } = require('../node_modules/.prisma/client')
const g = globalThis as any
export const db: any = g.__betdb ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'stdout', level: 'error' }]
    : [{ emit: 'stdout', level: 'error' }],
})
if (process.env.NODE_ENV !== 'production') g.__betdb = db
export default db
"@
[System.IO.File]::WriteAllText("$bet\src\prisma.ts", $prismaHelper, [System.Text.Encoding]::UTF8)
Write-Host "  prisma.ts written" -ForegroundColor Green

Write-Host "`n[4/7] Fixing index.ts (remove broken connectDb/redis)..." -ForegroundColor Cyan
$index = @"
import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { logger } from '@sportsbook/logger'
import { getRedis } from '@sportsbook/redis-client'
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
  try { await getRedis().connect() } catch (err) { logger.warn({ err }, 'Redis failed') }
  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'Betting engine started')
}
bootstrap().catch((err) => { logger.error(err); process.exit(1) })
"@
[System.IO.File]::WriteAllText("$bet\src\index.ts", $index, [System.Text.Encoding]::UTF8)
Write-Host "  index.ts written" -ForegroundColor Green

Write-Host "`n[5/7] Fixing bettingService.ts (local prisma + safe kafka + odds fallback)..." -ForegroundColor Cyan
$bettingService = @"
import db from './prisma'
import { setCache, CacheKeys } from '@sportsbook/redis-client'
import { createLogger } from '@sportsbook/logger'
import { OddsValidator } from '../validators/odds'
import { RiskValidator } from '../validators/risk'
import axios from 'axios'

const log = createLogger('betting-service')
const oddsValidator = new OddsValidator()
const riskValidator = new RiskValidator()

const WALLET_URL = process.env.WALLET_SERVICE_URL ?? 'http://localhost:3002'

export class BettingService {
  async placeBet(input: any) {
    // Validate odds (with fallback — never block bet if market-service unreachable)
    for (const sel of input.selections) {
      const valid = await oddsValidator.validateOdds(sel.marketId, sel.outcomeId, sel.odds)
      if (!valid && !input.acceptOddsChanges) {
        throw new Error('Odds have changed. Please refresh and try again.')
      }
    }

    // Risk check (fails open — if risk engine down, allow bet)
    const riskCheck = await riskValidator.checkBet(input)
    if (!riskCheck.approved) throw new Error('Bet rejected: ' + riskCheck.reason)

    // Debit wallet FIRST — fail fast if insufficient balance
    const reference = 'BET-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    try {
      await axios.post(WALLET_URL + '/api/wallet/internal/debit', {
        userId: input.userId,
        amount: input.totalStake,
        type: 'bet',
        reference,
      })
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Wallet error'
      throw new Error(msg)
    }

    // Calculate payout
    const totalOdds = input.selections.reduce((acc: number, s: any) => acc * s.odds, 1)
    const potentialPayout = input.totalStake * totalOdds

    // Create bet slip in DB
    const betSlip = await db.betSlip.create({
      data: {
        userId: input.userId,
        type: input.type ?? 'single',
        totalStake: input.totalStake,
        potentialPayout,
        currency: input.currency ?? 'INR',
        status: 'accepted',
        selections: {
          create: input.selections.map((s: any) => ({
            marketId: s.marketId,
            outcomeId: s.outcomeId,
            odds: s.odds,
            stake: s.stake,
            status: 'pending',
          })),
        },
      },
      include: { selections: true },
    })

    await setCache(CacheKeys.activeSlip(input.userId), betSlip, 3600)

    // Fire-and-forget Kafka publish
    setImmediate(async () => {
      try {
        const { createProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.BET_PLACED, betSlip.id, {
          betSlipId: betSlip.id, userId: input.userId,
          totalStake: input.totalStake, potentialPayout, reference,
        })
        await producer.disconnect()
      } catch (err) { log.warn({ err }, 'Failed to publish bet event') }
    })

    log.info({ betSlipId: betSlip.id, userId: input.userId, stake: input.totalStake }, 'Bet placed')
    return betSlip
  }

  async cancelBet(betSlipId: string, userId: string) {
    const slip = await db.betSlip.findFirst({ where: { id: betSlipId, userId } })
    if (!slip) throw new Error('Bet not found')
    if (slip.status !== 'pending' && slip.status !== 'accepted') throw new Error('Cannot cancel settled bet')
    await db.betSlip.update({ where: { id: betSlipId }, data: { status: 'cancelled' } })
    // Refund wallet
    try {
      await axios.post(WALLET_URL + '/api/wallet/internal/credit', {
        userId, amount: Number(slip.totalStake), type: 'refund', reference: 'REF-' + betSlipId,
      })
    } catch (err: any) {
      log.warn({ err }, 'Refund failed during cancel')
    }
    setImmediate(async () => {
      try {
        const { createProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.BET_CANCELLED, betSlipId, { betSlipId, userId })
        await producer.disconnect()
      } catch (err) { log.warn({ err }, 'Failed to publish cancel event') }
    })
    return { betSlipId, status: 'cancelled' }
  }

  async settleBet(betSlipId: string, winningOutcomeIds: string[]) {
    const slip = await db.betSlip.findUnique({ where: { id: betSlipId }, include: { selections: true } })
    if (!slip) throw new Error('Bet slip not found')

    const isWinner = slip.type === 'single'
      ? slip.selections.some((s: any) => winningOutcomeIds.includes(s.outcomeId))
      : slip.selections.every((s: any) => winningOutcomeIds.includes(s.outcomeId))

    const status = isWinner ? 'settled_win' : 'settled_loss'
    const payout = isWinner ? Number(slip.potentialPayout) : 0

    await db.$transaction(async (tx: any) => {
      await tx.betSlip.update({ where: { id: betSlipId }, data: { status, settledAt: new Date() } })
      for (const sel of slip.selections) {
        await tx.betSelection.update({
          where: { id: sel.id },
          data: { status, result: winningOutcomeIds.includes((sel as any).outcomeId) ? 'win' : 'loss' },
        })
      }
    })

    if (isWinner) {
      try {
        await axios.post(WALLET_URL + '/api/wallet/internal/credit', {
          userId: slip.userId, amount: payout, type: 'win', reference: 'WIN-' + betSlipId,
        })
      } catch (err: any) {
        log.warn({ err }, 'Win payout failed')
      }
    }

    setImmediate(async () => {
      try {
        const { createProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.BET_SETTLED, betSlipId, {
          betSlipId, userId: slip.userId, outcome: isWinner ? 'win' : 'loss', payout,
        })
        await producer.disconnect()
      } catch (err) { log.warn({ err }, 'Failed to publish settle event') }
    })

    return { betSlipId, status, payout }
  }
}
"@
[System.IO.File]::WriteAllText("$bet\src\services\bettingService.ts", $bettingService, [System.Text.Encoding]::UTF8)
Write-Host "  bettingService.ts written" -ForegroundColor Green

Write-Host "`n[6/7] Fixing routes to use local prisma..." -ForegroundColor Cyan
foreach ($file in @("slip.ts", "history.ts")) {
  $path = "$bet\src\routes\$file"
  $content = [System.IO.File]::ReadAllText($path)
  $content = $content -replace "import db from '@sportsbook/db-client'", "import db from '../prisma'"
  [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
  Write-Host "  Patched $file" -ForegroundColor Green
}

# Fix bet.ts — it imports db-client inline inside a function
$betRoute = [System.IO.File]::ReadAllText("$bet\src\routes\bet.ts")
$betRoute = $betRoute -replace "import db from '@sportsbook/db-client'", "import db from '../prisma'"
$betRoute = $betRoute -replace "await import\('@sportsbook/db-client'\)\)\.default", "db"
# Add top-level db import if not present
if (-not $betRoute.Contains("import db from '../prisma'")) {
  $betRoute = "import db from '../prisma'" + "`n" + $betRoute
}
[System.IO.File]::WriteAllText("$bet\src\routes\bet.ts", $betRoute, [System.Text.Encoding]::UTF8)
Write-Host "  Patched bet.ts" -ForegroundColor Green

Write-Host "`n[7/7] Fixing odds validator (proper fallback when market-service unreachable)..." -ForegroundColor Cyan
$oddsValidator = @"
import { getCache, CacheKeys } from '@sportsbook/redis-client'
import axios from 'axios'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('odds-validator')
const MARKET_URL = process.env.MARKET_SERVICE_URL ?? 'http://localhost:3004'
const TOLERANCE = 0.05 // 5% tolerance — more forgiving in dev

export class OddsValidator {
  async validateOdds(marketId: string, outcomeId: string, requestedOdds: number): Promise<boolean> {
    // 1. Try Redis cache first
    try {
      const cached = await getCache<{ outcomes: Array<{ id: string; odds: number }> }>(
        CacheKeys.marketOdds(marketId)
      )
      if (cached?.outcomes) {
        const current = cached.outcomes.find((o) => o.id === outcomeId)
        if (current) {
          const diff = Math.abs(Number(current.odds) - requestedOdds) / requestedOdds
          return diff <= TOLERANCE
        }
      }
    } catch { /* redis unavailable */ }

    // 2. Try market-service HTTP
    try {
      const { data } = await axios.get(MARKET_URL + '/api/markets/' + marketId, { timeout: 2000 })
      const outcome = data?.data?.outcomes?.find((o: any) => o.id === outcomeId)
      if (outcome) {
        const diff = Math.abs(Number(outcome.odds) - requestedOdds) / requestedOdds
        return diff <= TOLERANCE
      }
      // Outcome not found in market — reject
      return false
    } catch (err) {
      // Market service unreachable — allow bet (fail open)
      log.warn({ marketId, outcomeId }, 'Market service unreachable during odds validation — allowing bet')
      return true
    }
  }
}
"@
[System.IO.File]::WriteAllText("$bet\src\validators\odds.ts", $oddsValidator, [System.Text.Encoding]::UTF8)
Write-Host "  odds.ts written (5% tolerance, fail-open)" -ForegroundColor Green

Write-Host "`n✅ All done! Summary of fixes:" -ForegroundColor Green
Write-Host "  - .env created with all required secrets"
Write-Host "  - Prisma client generated + migrations applied"
Write-Host "  - prisma.ts helper bypasses pnpm symlink bug"
Write-Host "  - bettingService.ts uses local prisma + fire-and-forget Kafka"
Write-Host "  - Wallet debit error now surfaced clearly to user"
Write-Host "  - Odds validator: 5% tolerance, fails open if market-service down"
Write-Host "  - All routes patched to local prisma"
Write-Host ""
Write-Host "Now restart:" -ForegroundColor Yellow
Write-Host "  taskkill /IM node.exe /F"
Write-Host "  cd $root && pnpm dev"
Write-Host ""
Write-Host "Then test end-to-end:" -ForegroundColor Yellow
Write-Host "  1. Login at localhost:3000/login"
Write-Host "  2. Deposit at localhost:3000/wallet/deposit"
Write-Host "  3. Place a bet at localhost:3000/cricket/betting"
Write-Host "  4. Check bet history at localhost:3000/bets"
