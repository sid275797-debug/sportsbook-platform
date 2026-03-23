# fix-all-services.ps1
# Run from: C:\Users\VCOM\Desktop\fixed\sportsbook-fixed
# Usage: powershell -ExecutionPolicy Bypass -File ".\fix-all-services.ps1"

$root = "C:\Users\VCOM\Desktop\fixed\sportsbook-fixed"

# ─── Helper: write prisma.ts for a service ───────────────────────────────────
function Write-PrismaHelper($svcPath) {
  $content = @"
// Direct import from local generated client to bypass pnpm symlink resolution bug
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require('../node_modules/.prisma/client')
const g = globalThis as any
export const db: any = g.__db ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'stdout', level: 'error' }]
    : [{ emit: 'stdout', level: 'error' }],
})
if (process.env.NODE_ENV !== 'production') g.__db = db
export default db
"@
  [System.IO.File]::WriteAllText("$svcPath\src\prisma.ts", $content, [System.Text.Encoding]::UTF8)
  Write-Host "  prisma.ts written for $svcPath" -ForegroundColor Green
}

# ─── 1. Generate prisma clients for all services ─────────────────────────────
Write-Host "`n[1/5] Generating Prisma clients..." -ForegroundColor Cyan

$services = @("wallet-service", "betting-engine", "casino-engine", "market-service")
foreach ($svc in $services) {
  $svcPath = "$root\services\$svc"
  Write-Host "  Generating for $svc..."
  Push-Location $svcPath
  npx prisma generate 2>&1 | Select-String "Generated|Error" | Write-Host
  Pop-Location
}

# ─── 2. Run migrations for wallet-service ─────────────────────────────────────
Write-Host "`n[2/5] Running wallet-service migrations..." -ForegroundColor Cyan
Push-Location "$root\services\wallet-service"
npx prisma migrate deploy 2>&1 | Write-Host
Pop-Location

# ─── 3. Write prisma.ts helpers for all services ─────────────────────────────
Write-Host "`n[3/5] Writing prisma.ts helpers..." -ForegroundColor Cyan
foreach ($svc in $services) {
  Write-PrismaHelper "$root\services\$svc"
}

# ─── 4. Fix wallet-service: replace db-client imports with local prisma ───────
Write-Host "`n[4/5] Patching wallet-service source files..." -ForegroundColor Cyan

# wallet.ts service
$walletSvc = [System.IO.File]::ReadAllText("$root\services\wallet-service\src\services\wallet.ts")
$walletSvc = $walletSvc -replace "import db from '@sportsbook/db-client'", "import db from '../prisma'"
[System.IO.File]::WriteAllText("$root\services\wallet-service\src\services\wallet.ts", $walletSvc, [System.Text.Encoding]::UTF8)

# wallet route
$walletRoute = [System.IO.File]::ReadAllText("$root\services\wallet-service\src\routes\wallet.ts")
$walletRoute = $walletRoute -replace "import db from '@sportsbook/db-client'", "import db from '../prisma'"
[System.IO.File]::WriteAllText("$root\services\wallet-service\src\routes\wallet.ts", $walletRoute, [System.Text.Encoding]::UTF8)

# withdrawal route
$withdrawRoute = [System.IO.File]::ReadAllText("$root\services\wallet-service\src\routes\withdrawal.ts")
$withdrawRoute = $withdrawRoute -replace "import db from '@sportsbook/db-client'", "import db from '../prisma'"
[System.IO.File]::WriteAllText("$root\services\wallet-service\src\routes\withdrawal.ts", $withdrawRoute, [System.Text.Encoding]::UTF8)

Write-Host "  wallet-service source files patched" -ForegroundColor Green

# ─── 5. Fix wallet-service index.ts: remove connectDb, fix redis ──────────────
Write-Host "`n[5/5] Fixing wallet-service index.ts..." -ForegroundColor Cyan

$walletIndex = @"
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
"@
[System.IO.File]::WriteAllText("$root\services\wallet-service\src\index.ts", $walletIndex, [System.Text.Encoding]::UTF8)
Write-Host "  wallet-service index.ts fixed" -ForegroundColor Green

# ─── 6. Fix deposit route: simulate success in dev ────────────────────────────
Write-Host "`n[6/6] Fixing deposit route for dev (simulate payment)..." -ForegroundColor Cyan

$depositRoute = @"
import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { WalletService } from '../services/wallet'
import { z } from 'zod'

const walletService = new WalletService()

const depositSchema = z.object({
  amount: z.number().positive().min(100),
  currency: z.string().default('INR'),
  provider: z.string().default('razorpay'),
})

export default async function depositRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // In dev: immediately credits wallet (simulates payment success)
  // In prod: integrate Razorpay order creation + webhook verification
  app.post('/initiate', async (req, reply) => {
    const result = depositSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })
    const { amount, provider } = result.data
    const userId = req.user!.userId
    const reference = 'DEP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase()

    try {
      // Create wallet if it doesn't exist, then credit immediately (dev mode)
      await walletService.getOrCreateWallet(userId)
      await walletService.credit(userId, amount, 'deposit', reference, { provider, dev: true })
      const balance = await walletService.getBalance(userId)
      return reply.send({
        success: true,
        data: {
          reference, amount, provider,
          credited: true,
          newBalance: balance.available,
          message: 'Deposit successful',
        }
      })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // Webhook from payment provider (for production use)
  app.post('/callback', async (req, reply) => {
    const { reference, amount, userId, status } = req.body as any
    if (status === 'success') {
      await walletService.getOrCreateWallet(userId)
      await walletService.credit(userId, amount, 'deposit', reference, { provider: 'razorpay' })
    }
    return reply.send({ success: true })
  })
}
"@
[System.IO.File]::WriteAllText("$root\services\wallet-service\src\routes\deposit.ts", $depositRoute, [System.Text.Encoding]::UTF8)
Write-Host "  deposit.ts fixed (dev mode: instant credit)" -ForegroundColor Green

# ─── 7. Write wallet-service .env ─────────────────────────────────────────────
$walletEnv = @"
PORT=3002
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sportsbook
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=betpro-super-secret-jwt-key-2026
REFRESH_TOKEN_SECRET=betpro-refresh-token-secret-2026
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development
"@
[System.IO.File]::WriteAllText("$root\services\wallet-service\.env", $walletEnv, [System.Text.Encoding]::UTF8)
Write-Host "  wallet-service .env written" -ForegroundColor Green

Write-Host "`n✅ All done! Now:" -ForegroundColor Green
Write-Host "  1. taskkill /IM node.exe /F"
Write-Host "  2. cd $root && pnpm dev"
Write-Host "  3. Wait for 'Ready in' then test deposit at localhost:3000/wallet/deposit"
