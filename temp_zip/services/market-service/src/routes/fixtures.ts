import { FastifyInstance } from 'fastify'
import db from '@sportsbook/db-client'

export default async function fixtureRoutes(app: FastifyInstance) {
  app.get('/live', async (_req, reply) => {
    const fixtures = await db.fixture.findMany({
      where: { status: 'live' },
      include: { homeTeam: true, awayTeam: true, sport: true, markets: { include: { outcomes: true }, where: { status: 'live' } } },
    })
    return reply.send({ success: true, data: fixtures })
  })

  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const fixture = await db.fixture.findUnique({
      where: { id },
      include: { homeTeam: true, awayTeam: true, sport: true, markets: { include: { outcomes: true } } },
    })
    if (!fixture) return reply.status(404).send({ success: false, error: 'Fixture not found' })
    return reply.send({ success: true, data: fixture })
  })
}
