// Internal service-to-service routes — NOT proxied through the gateway
// Used by: betting-engine, casino-engine, settlement-engine
import { FastifyInstance } from 'fastify'
import { WalletService } from '../services/wallet'
import { z } from 'zod'

const walletService = new WalletService()

const creditSchema = z.object({
  userId:    z.string(),
  amount:    z.number().positive(),
  type:      z.string(),
  reference: z.string(),
  metadata:  z.record(z.unknown()).optional(),
})

const debitSchema = z.object({
  userId:    z.string(),
  amount:    z.number().positive(),
  type:      z.string(),
  reference: z.string(),
  metadata:  z.record(z.unknown()).optional(),
})

export default async function internalRoutes(app: FastifyInstance) {
  // POST /api/wallet/internal/credit
  app.post('/credit', async (req, reply) => {
    const result = creditSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.flatten() })
    }
    const { userId, amount, type, reference, metadata } = result.data
    const txn = await walletService.credit(userId, amount, type, reference, metadata)
    return reply.status(201).send({ success: true, data: txn })
  })

  // POST /api/wallet/internal/debit
  app.post('/debit', async (req, reply) => {
    const result = debitSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ success: false, error: result.error.flatten() })
    }
    const { userId, amount, type, reference, metadata } = result.data
    try {
      const txn = await walletService.debit(userId, amount, type, reference, metadata)
      return reply.status(201).send({ success: true, data: txn })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // POST /api/wallet/internal/lock
  app.post('/lock', async (req, reply) => {
    const { userId, amount } = req.body as { userId: string; amount: number }
    try {
      await walletService.lockFunds(userId, amount)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })

  // POST /api/wallet/internal/unlock
  app.post('/unlock', async (req, reply) => {
    const { userId, amount } = req.body as { userId: string; amount: number }
    try {
      await walletService.unlockFunds(userId, amount)
      return reply.send({ success: true })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })
}
