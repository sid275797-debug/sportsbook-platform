import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { BettingService } from '../services/bettingService'
import type { Currency } from '@sportsbook/shared-types'
import { z } from 'zod'

const bettingService = new BettingService()

const placeBetSchema = z.object({
  selections: z.array(z.object({
    marketId: z.string().uuid(),
    outcomeId: z.string().uuid(),
    odds: z.number().positive(),
    stake: z.number().positive().min(10),
  })).min(1).max(20),
  totalStake: z.number().positive().min(10),
  currency: z.string().default('INR'),
  type: z.enum(['single', 'accumulator']).default('single'),
  acceptOddsChanges: z.boolean().default(false),
})

export default async function betRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.post('/place', async (req, reply) => {
    const result = placeBetSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })
    try {
      const betSlip = await bettingService.placeBet({
        ...result.data,
        currency: result.data.currency as Currency,
        userId: req.user!.userId,
      })
      return reply.status(201).send({ success: true, data: betSlip })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  app.post('/:id/cancel', async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const result = await bettingService.cancelBet(id, req.user!.userId)
      return reply.send({ success: true, data: result })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  app.post('/internal/settle', async (req, reply) => {
    const { betSlipId, winningOutcomeIds } = req.body as { betSlipId: string; winningOutcomeIds: string[] }
    const result = await bettingService.settleBet(betSlipId, winningOutcomeIds)
    return reply.send({ success: true, data: result })
  })

  app.get('/internal/by-market/:marketId', async (req, reply) => {
    const { marketId } = req.params as { marketId: string }
    const bets = await (await import('@sportsbook/db-client')).default.betSlip.findMany({
      where: { selections: { some: { marketId } }, status: { in: ['pending', 'accepted'] } },
      include: { selections: true },
    })
    return reply.send({ success: true, data: bets })
  })
}
