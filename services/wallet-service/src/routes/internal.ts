import { FastifyInstance } from 'fastify'
import { authenticateInternal } from '@sportsbook/auth-middleware'
import { WalletService } from '../services/wallet'
import { z } from 'zod'

const walletService = new WalletService()
const creditSchema = z.object({ userId: z.string(), amount: z.number().positive(), type: z.string(), reference: z.string(), metadata: z.record(z.unknown()).optional() })
const debitSchema = z.object({ userId: z.string(), amount: z.number().positive(), type: z.string(), reference: z.string(), metadata: z.record(z.unknown()).optional() })
const lockSchema = z.object({ userId: z.string(), amount: z.number().positive() })

export default async function internalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticateInternal)

  app.post('/credit', async (req, reply) => {
    const r = creditSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ success: false, error: r.error.flatten() })
    try { const txn = await walletService.credit(r.data.userId, r.data.amount, r.data.type, r.data.reference, r.data.metadata); return reply.status(201).send({ success: true, data: txn }) }
    catch (err: any) { return reply.status(400).send({ success: false, error: err.message }) }
  })

  app.post('/debit', async (req, reply) => {
    const r = debitSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ success: false, error: r.error.flatten() })
    try { const txn = await walletService.debit(r.data.userId, r.data.amount, r.data.type, r.data.reference, r.data.metadata); return reply.status(201).send({ success: true, data: txn }) }
    catch (err: any) { return reply.status(400).send({ success: false, error: err.message }) }
  })

  app.post('/lock', async (req, reply) => {
    const r = lockSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ success: false, error: r.error.flatten() })
    try { await walletService.lockFunds(r.data.userId, r.data.amount); return reply.send({ success: true }) }
    catch (err: any) { return reply.status(400).send({ success: false, error: err.message }) }
  })

  app.post('/unlock', async (req, reply) => {
    const r = lockSchema.safeParse(req.body)
    if (!r.success) return reply.status(400).send({ success: false, error: r.error.flatten() })
    try { await walletService.unlockFunds(r.data.userId, r.data.amount); return reply.send({ success: true }) }
    catch (err: any) { return reply.status(400).send({ success: false, error: err.message }) }
  })
}
