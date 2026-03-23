import { FastifyInstance } from 'fastify'
import { authenticate } from '@sportsbook/auth-middleware'
import { WalletService } from '../services/wallet'
import db from '../prisma'

const walletService = new WalletService()

export default async function walletRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  app.get('/balance', async (req, reply) => {
    const balance = await walletService.getBalance(req.user!.userId)
    return reply.send({ success: true, data: balance })
  })

  app.get('/transactions', async (req, reply) => {
    const { page = '1', limit = '20', type } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where: any = { userId: req.user!.userId }
    if (type) where.type = type
    const [txns, total] = await Promise.all([
      db.transaction.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' } }),
      db.transaction.count({ where }),
    ])
    return reply.send({ success: true, data: txns, total })
  })
}
