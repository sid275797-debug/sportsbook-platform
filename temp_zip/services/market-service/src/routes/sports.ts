import { FastifyInstance } from 'fastify'
import db from '@sportsbook/db-client'

export default async function sportsRoutes(app: FastifyInstance) {
  app.get('/', async (_req, reply) => {
    const sports = await db.sport.findMany({ where: { isActive: true } })
    return reply.send({ success: true, data: sports })
  })

  app.get('/:id/fixtures', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status = 'upcoming' } = req.query as { status?: string }
    const fixtures = await db.fixture.findMany({
      where: { sportId: id, status },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { startTime: 'asc' },
    })
    return reply.send({ success: true, data: fixtures })
  })
}
