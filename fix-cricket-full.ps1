# fix-cricket-full.ps1
# Run from: C:\Users\VCOM\Desktop\fixed\sportsbook-fixed
# Usage: powershell -ExecutionPolicy Bypass -File ".\fix-cricket-full.ps1"

$root = "C:\Users\VCOM\Desktop\fixed\sportsbook-fixed"
$mktSvc = "$root\services\market-service"

Write-Host "`n[1/6] Writing market-service .env..." -ForegroundColor Cyan
$env = @"
PORT=3004
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sportsbook
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=betpro-super-secret-jwt-key-2026
REFRESH_TOKEN_SECRET=betpro-refresh-token-secret-2026
NODE_ENV=development
"@
[System.IO.File]::WriteAllText("$mktSvc\.env", $env, [System.Text.Encoding]::UTF8)
Write-Host "  .env written" -ForegroundColor Green

Write-Host "`n[2/6] Running market-service migrations..." -ForegroundColor Cyan
Push-Location $mktSvc
npx prisma migrate deploy 2>&1 | Write-Host
Pop-Location

Write-Host "`n[3/6] Fixing market-service index.ts (remove broken db-client)..." -ForegroundColor Cyan
$mktIndex = @"
import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { logger } from '@sportsbook/logger'
import { getRedis } from '@sportsbook/redis-client'
import { FeedConsumer } from './feed-consumer/consumer'
import sportsRoutes from './routes/sports'
import fixtureRoutes from './routes/fixtures'
import marketRoutes from './routes/markets'

const PORT = Number(process.env.PORT ?? 3004)
process.env.SERVICE_NAME = 'market-service'

async function bootstrap() {
  const app = Fastify({ logger: false, trustProxy: true })
  await app.register(cors)
  await app.register(sportsRoutes, { prefix: '/api/sports' })
  await app.register(fixtureRoutes, { prefix: '/api/fixtures' })
  await app.register(marketRoutes, { prefix: '/api/markets' })
  app.get('/health', async () => ({ status: 'ok', service: 'market-service' }))
  try { await getRedis().connect() } catch (err) { logger.warn({ err }, 'Redis failed') }
  try {
    const feedConsumer = new FeedConsumer()
    await feedConsumer.start()
  } catch (err) { logger.warn({ err }, 'Feed consumer failed to start') }
  await app.listen({ port: PORT, host: '0.0.0.0' })
  logger.info({ port: PORT }, 'Market service started')
}
bootstrap().catch((err) => { logger.error(err); process.exit(1) })
"@
[System.IO.File]::WriteAllText("$mktSvc\src\index.ts", $mktIndex, [System.Text.Encoding]::UTF8)

Write-Host "`n[4/6] Patching market-service routes to use local prisma..." -ForegroundColor Cyan
foreach ($file in @("fixtures.ts", "markets.ts", "sports.ts")) {
  $path = "$mktSvc\src\routes\$file"
  $content = [System.IO.File]::ReadAllText($path)
  $content = $content -replace "import db from '@sportsbook/db-client'", "import db from '../prisma'"
  $content = $content -replace "from '@sportsbook/redis-client'", "from '@sportsbook/redis-client'"
  [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
  Write-Host "  Patched $file" -ForegroundColor Green
}

Write-Host "`n[5/6] Writing IPL 2026 seed script..." -ForegroundColor Cyan

$seed = @'
// ipl-seed.js
// Run from: services\market-service
// Command: node ipl-seed.js

require('dotenv/config')
const { PrismaClient } = require('./node_modules/.prisma/client')
const prisma = new PrismaClient()

const IPL_TEAMS = [
  { name: 'Mumbai Indians',              short: 'MI'   },
  { name: 'Chennai Super Kings',         short: 'CSK'  },
  { name: 'Royal Challengers Bengaluru', short: 'RCB'  },
  { name: 'Kolkata Knight Riders',       short: 'KKR'  },
  { name: 'Delhi Capitals',              short: 'DC'   },
  { name: 'Sunrisers Hyderabad',         short: 'SRH'  },
  { name: 'Rajasthan Royals',            short: 'RR'   },
  { name: 'Punjab Kings',                short: 'PBKS' },
  { name: 'Lucknow Super Giants',        short: 'LSG'  },
  { name: 'Gujarat Titans',              short: 'GT'   },
]

// IPL 2026 schedule - first 20 matches
const SCHEDULE = [
  { home: 'MI',   away: 'CSK',  date: '2026-03-22T14:00:00Z', venue: 'Wankhede Stadium, Mumbai',              status: 'live'     },
  { home: 'RCB',  away: 'KKR',  date: '2026-03-23T10:00:00Z', venue: 'M. Chinnaswamy Stadium, Bengaluru',     status: 'upcoming' },
  { home: 'SRH',  away: 'DC',   date: '2026-03-23T14:00:00Z', venue: 'Rajiv Gandhi IS, Hyderabad',            status: 'upcoming' },
  { home: 'RR',   away: 'PBKS', date: '2026-03-24T14:00:00Z', venue: 'Sawai Mansingh Stadium, Jaipur',        status: 'upcoming' },
  { home: 'GT',   away: 'LSG',  date: '2026-03-25T14:00:00Z', venue: 'Narendra Modi Stadium, Ahmedabad',      status: 'upcoming' },
  { home: 'CSK',  away: 'RCB',  date: '2026-03-26T14:00:00Z', venue: 'MA Chidambaram Stadium, Chennai',       status: 'upcoming' },
  { home: 'KKR',  away: 'MI',   date: '2026-03-27T14:00:00Z', venue: 'Eden Gardens, Kolkata',                 status: 'upcoming' },
  { home: 'DC',   away: 'RR',   date: '2026-03-28T14:00:00Z', venue: 'Arun Jaitley Stadium, Delhi',           status: 'upcoming' },
  { home: 'PBKS', away: 'SRH',  date: '2026-03-29T14:00:00Z', venue: 'Punjab Cricket Association IS, Mohali', status: 'upcoming' },
  { home: 'LSG',  away: 'GT',   date: '2026-03-30T14:00:00Z', venue: 'BRSABV Ekana Cricket Stadium, Lucknow', status: 'upcoming' },
  { home: 'MI',   away: 'RCB',  date: '2026-03-31T14:00:00Z', venue: 'Wankhede Stadium, Mumbai',              status: 'upcoming' },
  { home: 'CSK',  away: 'KKR',  date: '2026-04-01T14:00:00Z', venue: 'MA Chidambaram Stadium, Chennai',       status: 'upcoming' },
  { home: 'SRH',  away: 'RR',   date: '2026-04-02T14:00:00Z', venue: 'Rajiv Gandhi IS, Hyderabad',            status: 'upcoming' },
  { home: 'DC',   away: 'PBKS', date: '2026-04-03T14:00:00Z', venue: 'Arun Jaitley Stadium, Delhi',           status: 'upcoming' },
  { home: 'GT',   away: 'MI',   date: '2026-04-04T14:00:00Z', venue: 'Narendra Modi Stadium, Ahmedabad',      status: 'upcoming' },
  { home: 'LSG',  away: 'CSK',  date: '2026-04-05T14:00:00Z', venue: 'BRSABV Ekana Cricket Stadium, Lucknow', status: 'upcoming' },
  { home: 'RCB',  away: 'SRH',  date: '2026-04-06T14:00:00Z', venue: 'M. Chinnaswamy Stadium, Bengaluru',     status: 'upcoming' },
  { home: 'KKR',  away: 'DC',   date: '2026-04-07T14:00:00Z', venue: 'Eden Gardens, Kolkata',                 status: 'upcoming' },
  { home: 'PBKS', away: 'GT',   date: '2026-04-08T14:00:00Z', venue: 'Punjab Cricket Association IS, Mohali', status: 'upcoming' },
  { home: 'RR',   away: 'LSG',  date: '2026-04-09T14:00:00Z', venue: 'Sawai Mansingh Stadium, Jaipur',        status: 'upcoming' },
]

// Odds based on team strength ratings
const TEAM_ODDS = {
  MI:   { home: 1.75, away: 2.10 },
  CSK:  { home: 1.80, away: 2.05 },
  RCB:  { home: 2.00, away: 1.85 },
  KKR:  { home: 1.95, away: 1.90 },
  DC:   { home: 2.10, away: 1.80 },
  SRH:  { home: 2.05, away: 1.85 },
  RR:   { home: 2.15, away: 1.78 },
  PBKS: { home: 2.20, away: 1.75 },
  LSG:  { home: 2.25, away: 1.72 },
  GT:   { home: 2.00, away: 1.88 },
}

async function main() {
  console.log('Seeding IPL 2026 data...')

  // Upsert cricket sport
  const cricket = await prisma.sport.upsert({
    where: { name: 'Cricket' },
    update: { isActive: true },
    create: { name: 'Cricket', type: 'cricket', isActive: true },
  })
  console.log('  Sport: Cricket ready')

  // Create IPL teams
  const teamMap = {}
  for (const t of IPL_TEAMS) {
    const team = await prisma.team.upsert({
      where: { id: t.short }, // we'll use findFirst instead
      update: {},
      create: { name: t.name, shortName: t.short, sportId: cricket.id },
    }).catch(async () => {
      // If upsert fails (no unique on name), use findFirst or create
      const existing = await prisma.team.findFirst({ where: { shortName: t.short, sportId: cricket.id } })
      if (existing) return existing
      return prisma.team.create({ data: { name: t.name, shortName: t.short, sportId: cricket.id } })
    })
    teamMap[t.short] = team
    console.log(`  Team: ${t.short} ready (${team.id})`)
  }

  // Create fixtures + markets
  let created = 0
  for (const match of SCHEDULE) {
    const homeTeam = teamMap[match.home]
    const awayTeam = teamMap[match.away]
    if (!homeTeam || !awayTeam) { console.log(`  SKIP: ${match.home} vs ${match.away} — team not found`); continue }

    // Check if fixture already exists
    const externalId = `IPL2026-${match.home}-${match.away}-${match.date.slice(0,10)}`
    const existing = await prisma.fixture.findFirst({ where: { externalId } })
    if (existing) { console.log(`  EXISTS: ${match.home} vs ${match.away}`); continue }

    const fixture = await prisma.fixture.create({
      data: {
        sportId:    cricket.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startTime:  new Date(match.date),
        status:     match.status,
        venue:      match.venue,
        externalId,
      }
    })

    const homeOdds = TEAM_ODDS[match.home]?.home ?? 1.90
    const awayOdds = TEAM_ODDS[match.away]?.away ?? 1.90

    // Market 1: Match Winner
    const mw = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'Match Winner', type: 'match_winner', status: match.status, inPlay: match.status === 'live' }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: mw.id, name: homeTeam.name, odds: homeOdds, probability: +(1/homeOdds).toFixed(6), isActive: true },
      { marketId: mw.id, name: awayTeam.name, odds: awayOdds, probability: +(1/awayOdds).toFixed(6), isActive: true },
    ]})

    // Market 2: Toss Winner
    const tw = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'Toss Winner', type: 'toss_winner', status: match.status, inPlay: false }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: tw.id, name: homeTeam.name + ' (Toss)', odds: 1.90, probability: 0.526316, isActive: true },
      { marketId: tw.id, name: awayTeam.name + ' (Toss)', odds: 1.90, probability: 0.526316, isActive: true },
    ]})

    // Market 3: Total Runs Over/Under
    const tr = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'Total Runs', type: 'total_runs', status: match.status, inPlay: match.status === 'live' }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: tr.id, name: 'Over 165.5',  odds: 1.88, probability: 0.531915, isActive: true },
      { marketId: tr.id, name: 'Under 165.5', odds: 1.92, probability: 0.520833, isActive: true },
    ]})

    // Market 4: First Over Runs
    const fo = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'First Over Runs', type: 'first_over', status: match.status, inPlay: match.status === 'live' }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: fo.id, name: 'Over 7.5',  odds: 1.85, probability: 0.540541, isActive: true },
      { marketId: fo.id, name: 'Under 7.5', odds: 1.95, probability: 0.512821, isActive: true },
    ]})

    console.log(`  Created: ${match.home} vs ${match.away} (${match.status}) — 4 markets`)
    created++
  }

  console.log(`\nDone! Created ${created} fixtures with markets.`)
  console.log('IPL 2026 data seeded successfully!')
}

main()
  .catch((e) => { console.error('Seed error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
'@

[System.IO.File]::WriteAllText("$mktSvc\ipl-seed.js", $seed, [System.Text.Encoding]::UTF8)
Write-Host "  ipl-seed.js written" -ForegroundColor Green

Write-Host "`n[6/6] Running IPL seed..." -ForegroundColor Cyan
Push-Location $mktSvc
node ipl-seed.js
Pop-Location

Write-Host "`nAll done! Now restart with:" -ForegroundColor Green
Write-Host "  taskkill /IM node.exe /F"
Write-Host "  cd $root && pnpm dev"
Write-Host ""
Write-Host "Then visit:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000/cricket/ipl     — IPL page"
Write-Host "  http://localhost:3000/cricket/live    — Live scores"
Write-Host "  http://localhost:3000/cricket/betting — Betting markets"
Write-Host "  http://localhost:4000/api/fixtures/upcoming?sport=cricket — API check"
