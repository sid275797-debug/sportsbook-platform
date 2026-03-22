import { FastifyInstance } from 'fastify'
import db from '@sportsbook/db-client'

export default async function fixtureRoutes(app: FastifyInstance) {
  // GET /api/fixtures/live
  app.get('/live', async (_req, reply) => {
    const fixtures = await db.fixture.findMany({
      where: { status: 'live' },
      include: {
        homeTeam: true,
        awayTeam: true,
        sport: true,
        markets: { include: { outcomes: true }, where: { status: 'live' } },
      },
      orderBy: { startTime: 'asc' },
    })
    return reply.send({ success: true, data: fixtures.map(normalizeFixture) })
  })

  // GET /api/fixtures/upcoming — used by homepage and sportsbook SSR
  app.get('/upcoming', async (req, reply) => {
    const { limit = '20', sport, includeMarkets } = req.query as Record<string, string>

    const where: any = { status: { in: ['upcoming', 'live'] } }
    if (sport) where.sport = { type: { contains: sport, mode: 'insensitive' } }

    const fixtures = await db.fixture.findMany({
      where,
      include: {
        homeTeam: true,
        awayTeam: true,
        sport: true,
        markets: includeMarkets === 'true'
          ? { include: { outcomes: true }, where: { status: { not: 'settled' } } }
          : false,
      },
      orderBy: { startTime: 'asc' },
      take: parseInt(limit),
    })
    return reply.send({ success: true, data: fixtures.map(normalizeFixture) })
  })

  // GET /api/fixtures/:id
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const fixture = await db.fixture.findUnique({
      where: { id },
      include: {
        homeTeam: true,
        awayTeam: true,
        sport: true,
        markets: { include: { outcomes: true } },
      },
    })
    if (!fixture) return reply.status(404).send({ success: false, error: 'Fixture not found' })
    return reply.send({ success: true, data: normalizeFixture(fixture) })
  })
}

// Normalize DB shape → frontend-expected shape
// Adds: startsAt alias, sport.slug from sport.type, competition stub
function normalizeFixture(f: any) {
  return {
    ...f,
    // Frontend uses startsAt; DB stores startTime
    startsAt: f.startTime,
    isLive: f.status === 'live',
    // sport.slug derived from sport.type (lowercased)
    sport: f.sport ? { ...f.sport, slug: f.sport.type?.toLowerCase() ?? f.sport.name?.toLowerCase() } : f.sport,
    // competition stub — not in schema, synthesize from sport name for now
    competition: {
      id:   f.sportId,
      name: f.sport?.name ?? 'Unknown',
      country: null,
    },
    marketCount: f.markets?.length ?? 0,
  }
}
