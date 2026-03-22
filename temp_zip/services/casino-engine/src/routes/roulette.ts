import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { RouletteGame } from '../games/roulette/rouletteGame'
import { z } from 'zod'

const rouletteGame = new RouletteGame()
const schema = z.object({ bets: z.array(z.object({ betType: z.string(), amount: z.number().positive(), numbers: z.array(z.number()) })) })

export default async function rouletteRoutes(app: FastifyInstance) {
  app.post('/spin', { preHandler: [authenticate] }, async (req, reply) => {
    const r = schema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ success: false, error: r.error.flatten() })
    const bets = r.data.bets.map((b) => ({ ...b, userId: req.user!.userId }))
    const outcome = await rouletteGame.spin(bets)
    return reply.send({ success: true, data: outcome })
  })
}
