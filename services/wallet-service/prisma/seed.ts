import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// These must match the user IDs created by seed-user-service.ts
// We look them up by email so order doesn't matter
async function main() {
  console.log('Seeding wallets...')

  // Connect to user DB to get user IDs
  // Wallet service has its own DB — we seed wallets by known userId
  // Since we can't cross-DB query here, we insert with placeholder UUIDs
  // that match what the user service created. Instead, seed after registering
  // via the API, or use fixed UUIDs below.

  // Seed demo wallets with fixed UUIDs matching seed-user-service users
  const demoWallets = [
    { userId: 'demo-user-001', balance: 10000 },
    { userId: 'demo-user-002', balance: 5000 },
    { userId: 'demo-user-003', balance: 2500 },
  ]

  for (const w of demoWallets) {
    await prisma.wallet.upsert({
      where: { userId: w.userId },
      update: {},
      create: {
        userId: w.userId,
        currency: 'INR',
        balance: w.balance,
        lockedBalance: 0,
        bonusBalance: 500,
      },
    })
    console.log(`  Wallet for ${w.userId}: ₹${w.balance}`)
  }

  console.log('Done seeding wallets!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())