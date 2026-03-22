import { FastifyRequest } from 'fastify'

// Use a simple interface instead of importing from 'ws' directly
interface WsClient {
  readyState: number
  send(data: string): void
  on(event: string, listener: (...args: unknown[]) => void): void
}

export const wsClients = new Set<WsClient>()

export function wsHandler(connection: { socket: WsClient }, req: FastifyRequest) {
  const { socket } = connection
  wsClients.add(socket)

  socket.on('message', (raw: unknown) => {
    try {
      const msg = JSON.parse(String(raw))
      if (msg.type === 'PING') socket.send(JSON.stringify({ type: 'PONG' }))
    } catch {}
  })

  socket.on('close', () => wsClients.delete(socket))
  socket.on('error', () => wsClients.delete(socket))

  socket.send(JSON.stringify({ type: 'CONNECTED', clients: wsClients.size }))
}
