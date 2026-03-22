import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { crashGameInstance } from '../games/crash/crashInstance'
import db from '@sportsbook/db-client'

// Use the shared singleton — same instance the game loop uses
const crashGame = crashGameInstance

export default async function crashRoutes(app: FastifyInstance) {
  app.get('/current', async (_req, reply) => {
    return reply.send({ success: true, data: { roundId: crashGame.getCurrentRoundId(), multiplier: crashGame.getCurrentMultiplier() } })
  })
  app.post('/bet', { preHandler: [authenticate] }, async (req, reply) => {
    const { stake, roundId } = req.body as { stake: number; roundId: string }
    try {
      const bet = await crashGame.placeBet(req.user!.userId, stake, roundId)
      return reply.status(201).send({ success: true, data: bet })
    } catch (err: any) { return reply.status(400).send({ success: false, error: err.message }) }
  })
  app.post('/cashout', { preHandler: [authenticate] }, async (req, reply) => {
    const { roundId } = req.body as { roundId: string }
    try {
      const result = await crashGame.cashout(req.user!.userId, roundId)
      return reply.send({ success: true, data: result })
    } catch (err: any) { return reply.status(400).send({ success: false, error: err.message }) }
  })
  app.get('/history', async (_req, reply) => {
    const history = await db.crashRound.findMany({ orderBy: { createdAt: 'desc' }, take: 50 })
    return reply.send({ success: true, data: history })
  })
}
