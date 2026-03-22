import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const db = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
    : [{ emit: 'stdout', level: 'error' }],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export async function connectDb(): Promise<void> {
  await db.$connect()
  console.log('[db-client] Database connected')
}

export async function disconnectDb(): Promise<void> {
  await db.$disconnect()
  console.log('[db-client] Database disconnected')
}

export function getDb() { return db }

export default db
