import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { WalletService } from '../services/wallet'
import { z } from 'zod'
import db from '../prisma'

const walletService = new WalletService()

const withdrawSchema = z.object({
  amount: z.number().positive().min(500),
  method: z.enum(['bank', 'upi', 'crypto']),
  bankDetails: z.object({
    accountNumber: z.string(),
    ifscCode: z.string(),
    accountHolder: z.string(),
  }).optional(),
  upiId: z.string().optional(),
  cryptoAddress: z.string().optional(),
})

export default async function withdrawalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.post('/request', async (req, reply) => {
    const result = withdrawSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })

    const { amount, method, ...details } = result.data
    const balance = await walletService.getBalance(req.user!.userId)
    if (balance.available < amount) return reply.status(400).send({ success: false, error: 'Insufficient balance' })

    await walletService.debit(req.user!.userId, amount, 'withdrawal', `WD-${Date.now()}`)
    const withdrawal = await db.withdrawal.create({
      data: { walletId: (await db.wallet.findUnique({ where: { userId: req.user!.userId } }))!.id, userId: req.user!.userId, amount, method, details: details as any },
    })
    return reply.status(201).send({ success: true, data: withdrawal })
  })

  app.get('/history', async (req, reply) => {
    const withdrawals = await db.withdrawal.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ success: true, data: withdrawals })
  })
}
