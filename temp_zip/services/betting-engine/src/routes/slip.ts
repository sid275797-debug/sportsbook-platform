import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import db from '@sportsbook/db-client'

export default async function slipRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const slip = await db.betSlip.findFirst({
      where: { id, userId: req.user!.userId },
      include: { selections: true },
    })
    if (!slip) return reply.status(404).send({ success: false, error: 'Bet slip not found' })
    return reply.send({ success: true, data: slip })
  })

  app.get('/active', async (req, reply) => {
    const slips = await db.betSlip.findMany({
      where: { userId: req.user!.userId, status: { in: ['pending', 'accepted'] } },
      include: { selections: true },
      orderBy: { placedAt: 'desc' },
    })
    return reply.send({ success: true, data: slips })
  })
}
