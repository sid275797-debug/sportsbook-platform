// Fix 1: All .env files with correct keys
// Fix 2: Crash game roundNumber conflict - read max from DB on startup
// Fix 3: Upcoming fixtures date issue
// Fix 4: Homepage casino games missing new games

const fs = require('fs')
const path = require('path')

const ROOT = path.dirname(__filename)

// ── FIX 1: Write correct .env files ─────────────────────────────────────────

const JWT_SECRET = 'local-dev-jwt-secret-betpro-2026'
const REFRESH_SECRET = 'local-dev-refresh-secret-betpro-2026'

const envFiles = {
  'services/user-service/.env': `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/userdb?schema=public
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000
`,
  'services/wallet-service/.env': `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/walletdb?schema=public
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
PORT=3002
NODE_ENV=development
`,
  'services/betting-engine/.env': `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bettingdb?schema=public
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
PORT=3003
NODE_ENV=development
WALLET_SERVICE_URL=http://localhost:3002
MARKET_SERVICE_URL=http://localhost:3004
`,
  'services/casino-engine/.env': `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/casinodb?schema=public
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
PORT=3006
NODE_ENV=development
WALLET_SERVICE_URL=http://localhost:3002
`,
  'services/market-service/.env': `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketdb?schema=public
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
PORT=3004
NODE_ENV=development
`,
  'services/settlement-engine/.env': `BETTING_ENGINE_URL=http://localhost:3003
WALLET_SERVICE_URL=http://localhost:3002
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=settlement-engine
LOG_LEVEL=info
NODE_ENV=development
PORT=3005
`,
  'services/gateway/.env': `GATEWAY_PORT=4000
USER_SERVICE_URL=http://localhost:3001
WALLET_SERVICE_URL=http://localhost:3002
BETTING_ENGINE_URL=http://localhost:3003
MARKET_SERVICE_URL=http://localhost:3004
SETTLEMENT_ENGINE_URL=http://localhost:3005
CASINO_ENGINE_URL=http://localhost:3006
JWT_SECRET=${JWT_SECRET}
REFRESH_TOKEN_SECRET=${REFRESH_SECRET}
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development
`,
}

for (const [relPath, content] of Object.entries(envFiles)) {
  const fullPath = path.join(ROOT, relPath)
  fs.writeFileSync(fullPath, content, 'utf8')
  console.log('✅ Written:', relPath)
}

console.log('\nAll .env files fixed! Restart pnpm dev to apply.')
