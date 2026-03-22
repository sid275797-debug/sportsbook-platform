import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { WalletService } from '../services/wallet'
import { z } from 'zod'

const walletService = new WalletService()

const depositSchema = z.object({
  amount: z.number().positive().min(100),
  currency: z.string().default('INR'),
  provider: z.enum(['razorpay', 'stripe', 'crypto']).default('razorpay'),
})

export default async function depositRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.post('/initiate', async (req, reply) => {
    const result = depositSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })
    const { amount, provider } = result.data
    const reference = `DEP-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    // In production: call provider SDK to create order/payment intent
    return reply.send({ success: true, data: { reference, amount, provider, paymentUrl: `https://payment.example.com/${reference}` } })
  })

  app.post('/callback', async (req, reply) => {
    // Webhook from payment provider - verify signature in production
    const { reference, amount, userId, status } = req.body as any
    if (status === 'success') {
      await walletService.credit(userId, amount, 'deposit', reference, { provider: 'razorpay' })
    }
    return reply.send({ success: true })
  })
}
