import jwt from 'jsonwebtoken'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UserRole } from '@sportsbook/shared-types'

export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload
  }
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.sign(payload as object, secret, { expiresIn: '1h' } as any)
}

export function signRefreshToken(userId: string): string {
  const secret = process.env.REFRESH_TOKEN_SECRET
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not set')
  return jwt.sign({ userId }, secret, { expiresIn: '30d' } as any)
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.verify(token, secret) as JwtPayload
}

export function verifyRefreshToken(token: string): { userId: string } {
  const secret = process.env.REFRESH_TOKEN_SECRET
  if (!secret) throw new Error('REFRESH_TOKEN_SECRET is not set')
  return jwt.verify(token, secret) as { userId: string }
}

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    reply.status(401).send({ success: false, error: 'Unauthorized' })
    return
  }
  try {
    const token = auth.slice(7)
    req.user = verifyToken(token)
  } catch {
    reply.status(401).send({ success: false, error: 'Invalid or expired token' })
    return
  }
}

export function requireRole(...roles: UserRole[]) {
  return async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!req.user || !roles.includes(req.user.role)) {
      reply.status(403).send({ success: false, error: 'Forbidden' })
      return
    }
  }
}

export async function authenticateInternal(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const secret = req.headers['x-internal-secret'] as string
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    reply.status(403).send({ success: false, error: 'Forbidden: invalid internal secret' })
    return
  }
}
