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