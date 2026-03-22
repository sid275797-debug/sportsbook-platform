import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding users...')

  const hash = await bcrypt.hash('password123', 10)

  const users = [
    { email: 'admin@sportsbook.com', username: 'admin', role: 'admin' },
    { email: 'john@example.com', username: 'john_doe', role: 'user' },
    { email: 'jane@example.com', username: 'jane_smith', role: 'user' },
    { email: 'testuser@example.com', username: 'testuser', role: 'user' },
  ]

  for (const u of users) {
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
    console.log(`  Created user: ${u.email}`)
  }

  console.log('Done seeding users!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())