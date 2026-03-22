import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { DiceGame } from '../games/dice/diceGame'
import { z } from 'zod'

const diceGame = new DiceGame()
const schema = z.object({ betAmount: z.number().positive().min(10), target: z.number().min(1).max(98), rollOver: z.boolean(), clientSeed: z.string() })

export default async function diceRoutes(app: FastifyInstance) {
  app.post('/roll', { preHandler: [authenticate] }, async (req, reply) => {
    const r = schema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ success: false, error: r.error.flatten() })
    const round = await diceGame.roll(req.user!.userId, r.data.betAmount, r.data.target, r.data.rollOver, r.data.clientSeed)
    return reply.send({ success: true, data: round })
  })
}
