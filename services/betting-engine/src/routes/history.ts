import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import db from '../prisma'

function addTotalOdds(slip: any) {
  const selections = slip.selections ?? []
  const totalOdds = selections.reduce((acc: number, s: any) => acc * Number(s.odds), 1)
  return { ...slip, totalOdds: Math.round(totalOdds * 100) / 100 }
}

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
    return reply.send({ success: true, data: slips.map(addTotalOdds), total, page: parseInt(page) })
  })
}
