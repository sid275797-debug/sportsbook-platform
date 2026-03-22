// Lazy Prisma client — each service has its own prisma schema and runs
// `prisma generate` which creates @prisma/client in the service's node_modules.
// This package just provides the shared connection singleton pattern.

let _db: any = null

export function getDb(): any {
  if (!_db) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client')
    _db = new PrismaClient({
      log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
        : [{ emit: 'stdout', level: 'error' }],
    })
    if (process.env.NODE_ENV !== 'production') {
      (globalThis as any).__prisma = _db
    }
  }
  return _db
}

export async function connectDb(): Promise<void> {
  await getDb().$connect()
  console.log('[db-client] Database connected')
}

export async function disconnectDb(): Promise<void> {
  await getDb().$disconnect()
  console.log('[db-client] Database disconnected')
}

// Default export matches usage pattern: import db from '@sportsbook/db-client'
const db = new Proxy({} as any, {
  get(_target, prop) {
    return getDb()[prop]
  },
})

export default db
