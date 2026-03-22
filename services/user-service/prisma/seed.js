const { PrismaClient } = require('../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/userdb?schema=public' } }
})

async function main() {
  console.log('Seeding users...')

  const hash = await bcrypt.hash('password123', 10)

  const users = [
    { email: 'admin@sportsbook.com', username: 'admin', role: 'admin' },
    { email: 'john@example.com', username: 'john_doe', role: 'user' },
    { email: 'jane@example.com', username: 'jane_smith', role: 'user' },
    { email: 'test@example.com', username: 'testuser', role: 'user' },
  ]

  for (const u of users) {
    try {
      await prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          username: u.username,
          passwordHash: hash,
          role: u.role,
          kycStatus: 'verified',
          isActive: true,
          referralCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        },
      })
      console.log('  Created:', u.email)
    } catch (e) {
      console.log('  Skipped (exists):', u.email)
    }
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
