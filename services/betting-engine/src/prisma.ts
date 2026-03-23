const { PrismaClient } = require('../node_modules/.prisma/client')
const g = globalThis as any
export const db: any = g.__betdb ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'stdout', level: 'error' }]
    : [{ emit: 'stdout', level: 'error' }],
})
if (process.env.NODE_ENV !== 'production') g.__betdb = db
export default db