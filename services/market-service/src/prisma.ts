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