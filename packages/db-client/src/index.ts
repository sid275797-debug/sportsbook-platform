// Lazy Prisma client — resolves the correct @prisma/client for the calling service
// Each service has its own prisma schema and generated client.

let _db: any = null

export function getDb(): any {
  if (!_db) {
    // Try to resolve @prisma/client from the process working directory (the service)
    // This ensures we get the service-specific generated client, not the shared one
    let PrismaClient: any
    try {
      // Resolve from cwd (the service directory when running tsx watch)
      const clientPath = require.resolve('@prisma/client', { paths: [process.cwd()] })
      PrismaClient = require(clientPath).PrismaClient
    } catch {
      // Fallback to standard resolution
      PrismaClient = require('@prisma/client').PrismaClient
    }

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
