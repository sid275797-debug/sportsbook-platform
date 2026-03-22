import { FastifyRequest, FastifyReply } from 'fastify'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('gateway')

export async function loggingMiddleware(req: FastifyRequest, _reply: FastifyReply) {
  log.info({
    method: req.method, url: req.url,
    ip: req.ip, userAgent: req.headers['user-agent'],
  }, 'Request')
}
