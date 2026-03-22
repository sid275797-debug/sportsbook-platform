import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import db from '@sportsbook/db-client'
import { deleteCache, CacheKeys } from '@sportsbook/redis-client'

const updateSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  phone: z.string().optional(),
})

const kycSchema = z.object({
  type: z.enum(['aadhaar', 'pan', 'passport', 'driving_license']),
  documentUrl: z.string().url(),
})

export class ProfileController {
  async getProfile(req: FastifyRequest, reply: FastifyReply) {
    const user = await db.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, username: true, phone: true, role: true, kycStatus: true, referralCode: true, createdAt: true },
    })
    return reply.send({ success: true, data: user })
  }

  async updateProfile(req: FastifyRequest, reply: FastifyReply) {
    const result = updateSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })

    const user = await db.user.update({
      where: { id: req.user!.userId },
      data: result.data,
      select: { id: true, email: true, username: true, phone: true },
    })
    await deleteCache(CacheKeys.user(req.user!.userId))
    return reply.send({ success: true, data: user })
  }

  async submitKyc(req: FastifyRequest, reply: FastifyReply) {
    const result = kycSchema.safeParse(req.body)
    if (!result.success) return reply.status(400).send({ success: false, error: result.error.flatten() })

    const doc = await db.kycDocument.create({
      data: { userId: req.user!.userId, ...result.data, status: 'pending' },
    })
    await db.user.update({ where: { id: req.user!.userId }, data: { kycStatus: 'submitted' } })
    return reply.status(201).send({ success: true, data: doc })
  }

  async kycStatus(req: FastifyRequest, reply: FastifyReply) {
    const docs = await db.kycDocument.findMany({
      where: { userId: req.user!.userId },
      orderBy: { submittedAt: 'desc' },
    })
    return reply.send({ success: true, data: docs })
  }
}
