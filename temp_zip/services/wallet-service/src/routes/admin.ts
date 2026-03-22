import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '@sportsbook/auth-middleware'
import { WalletService } from '../services/wallet'
import db from '@sportsbook/db-client'

const walletService = new WalletService()

export default async function adminWalletRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireRole('admin'))

  app.post('/bonus', async (req, reply) => {
    const { userId, amount, reason } = req.body as { userId: string; amount: number; reason: string }
    const txn = await walletService.credit(userId, amount, 'bonus', `BONUS-${Date.now()}`, { reason })
    return reply.send({ success: true, data: txn })
  })

  app.patch('/withdrawal/:id/process', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { status } = req.body as { status: 'completed' | 'failed' }
    const withdrawal = await db.withdrawal.update({ where: { id }, data: { status, processedAt: new Date() } })
    return reply.send({ success: true, data: withdrawal })
  })
}
