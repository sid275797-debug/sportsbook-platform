import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { WalletService } from '../services/wallet'
import { z } from 'zod'

const walletService = new WalletService()

const depositSchema = z.object({
  amount: z.number().positive().min(100),
  currency: z.string().default('INR'),
  provider: z.string().default('razorpay'),
})

export default async function depositRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // In dev: immediately credits wallet (simulates payment success)
  // In prod: integrate Razorpay order creation + webhook verification
  app.post('/initiate', async (req, reply) => {
    const result = depositSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })
    const { amount, provider } = result.data
    const userId = req.user!.userId
    const reference = 'DEP-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase()

    try {
      // Create wallet if it doesn't exist, then credit immediately (dev mode)
      await walletService.getOrCreateWallet(userId)
      await walletService.credit(userId, amount, 'deposit', reference, { provider, dev: true })
      const balance = await walletService.getBalance(userId)
      return reply.send({
        success: true,
        data: {
          reference, amount, provider,
          credited: true,
          newBalance: balance.available,
          message: 'Deposit successful',
        }
      })
    } catch (err: any) {
      return reply.status(500).send({ success: false, error: err.message })
    }
  })

  // Webhook from payment provider (for production use)
  app.post('/callback', async (req, reply) => {
    const { reference, amount, userId, status } = req.body as any
    if (status === 'success') {
      await walletService.getOrCreateWallet(userId)
      await walletService.credit(userId, amount, 'deposit', reference, { provider: 'razorpay' })
    }
    return reply.send({ success: true })
  })
}