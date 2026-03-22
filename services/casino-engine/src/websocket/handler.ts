import { FastifyRequest } from 'fastify'
import { verifyToken } from '@sportsbook/auth-middleware'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('ws-handler')

interface WsClient {
  readyState: number
  send(data: string): void
  on(event: string, listener: (...args: unknown[]) => void): void
  userId?: string
  username?: string
}

export const wsClients = new Set<WsClient>()

export function wsHandler(connection: { socket: WsClient }, req: FastifyRequest) {
  const { socket } = connection

  // Attempt to authenticate from query param token or Authorization header
  const token =
    (req.query as Record<string, string>)?.token ??
    req.headers.authorization?.replace('Bearer ', '')

  if (token) {
    try {
      const payload = verifyToken(token)
      socket.userId   = payload.userId
      socket.username = payload.email?.split('@')[0] ?? 'player'
    } catch {
      log.debug('WS client connected without valid token (spectator)')
    }
  }

  wsClients.add(socket)

  socket.on('message', (raw: unknown) => {
    try {
      const msg = JSON.parse(String(raw))
      if (msg.type === 'PING') socket.send(JSON.stringify({ type: 'PONG' }))
      // Client can send AUTH message after connection
      if (msg.type === 'AUTH' && msg.token) {
        try {
          const payload = verifyToken(msg.token)
          socket.userId   = payload.userId
          socket.username = payload.email?.split('@')[0] ?? 'player'
          socket.send(JSON.stringify({ type: 'AUTH_OK', username: socket.username }))
        } catch {
          socket.send(JSON.stringify({ type: 'AUTH_FAIL' }))
        }
      }
    } catch {}
  })

  socket.on('close', () => wsClients.delete(socket))
  socket.on('error', () => wsClients.delete(socket))

  socket.send(JSON.stringify({ type: 'CONNECTED', clients: wsClients.size }))
}
