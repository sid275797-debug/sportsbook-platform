import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import db from '@sportsbook/db-client'

export default async function historyRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/', async (req, reply) => {
    const { page = '1', limit = '20', status } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: any = { userId: req.user!.userId }
    if (status) where.status = status
    const [slips, total] = await Promise.all([
      db.betSlip.findMany({ where, skip, take: parseInt(limit), include: { selections: true }, orderBy: { placedAt: 'desc' } }),
      db.betSlip.count({ where }),
    ])
    return reply.send({ success: true, data: slips, total, page: parseInt(page) })
  })
}
