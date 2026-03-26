import { FastifyInstance } from 'fastify'
import { authenticate, requireRole } from '@sportsbook/auth-middleware'
import db from '../prisma'

export default async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', requireRole('admin'))

  app.get('/users', async (req, reply) => {
    const { page = '1', limit = '20', search } = req.query as Record<string, string>
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = search ? { OR: [{ email: { contains: search } }, { username: { contains: search } }] } : {}
    const [users, total] = await Promise.all([
      db.user.findMany({ where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, username: true, role: true, kycStatus: true, isActive: true, createdAt: true } }),
      db.user.count({ where }),
    ])
    return reply.send({ success: true, data: users, total, page: parseInt(page), limit: parseInt(limit) })
  })

  app.patch('/users/:id/status', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { isActive } = req.body as { isActive: boolean }
    const user = await db.user.update({ where: { id }, data: { isActive } })
    return reply.send({ success: true, data: { id: user.id, isActive: user.isActive } })
  })

  app.patch('/kyc/:docId/review', async (req, reply) => {
    const { docId } = req.params as { docId: string }
    const { status, note } = req.body as { status: 'verified' | 'rejected'; note?: string }
    const doc = await db.kycDocument.update({
      where: { id: docId },
      data: { status, reviewNote: note, reviewedAt: new Date(), reviewedBy: req.user!.userId },
    })
    if (status === 'verified') {
      await db.user.update({ where: { id: doc.userId }, data: { kycStatus: 'verified' } })
    }
    return reply.send({ success: true, data: doc })
  })
}
