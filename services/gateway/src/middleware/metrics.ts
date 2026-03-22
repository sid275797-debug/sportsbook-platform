import { FastifyRequest, FastifyReply } from 'fastify'
import { getRedis } from '@sportsbook/redis-client'

export async function metricsMiddleware(req: FastifyRequest, _reply: FastifyReply) {
  const r = getRedis()
  const minute = Math.floor(Date.now() / 60000)
  await r.incr(`metrics:requests:${minute}`)
  await r.expire(`metrics:requests:${minute}`, 3600)
}
