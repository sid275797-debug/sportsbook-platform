import { FastifyInstance } from 'fastify'
import db from '../prisma'
import { getCache, setCache, CacheKeys } from '@sportsbook/redis-client'
import { authenticate, requireRole } from '@sportsbook/auth-middleware'

export default async function marketRoutes(app: FastifyInstance) {
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const cached = await getCache(CacheKeys.marketOdds(id))
    if (cached) return reply.send({ success: true, data: cached, cached: true })

    const market = await db.market.findUnique({ where: { id }, include: { outcomes: true } })
    if (!market) return reply.status(404).send({ success: false, error: 'Market not found' })
    await setCache(CacheKeys.marketOdds(id), market, 30)
    return reply.send({ success: true, data: market })
  })

  // Admin: create market
  app.post('/', { preHandler: [authenticate, requireRole('admin', 'trader')] }, async (req, reply) => {
    const { fixtureId, name, type, outcomes } = req.body as any
    const market = await db.market.create({
      data: {
        fixtureId, name, type,
        outcomes: { create: outcomes },
      },
      include: { outcomes: true },
    })
    return reply.status(201).send({ success: true, data: market })
  })

  // Admin: suspend market
  app.patch('/:id/suspend', { preHandler: [authenticate, requireRole('admin', 'trader')] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const market = await db.market.update({ where: { id }, data: { status: 'suspended' } })
    return reply.send({ success: true, data: market })
  })
}
