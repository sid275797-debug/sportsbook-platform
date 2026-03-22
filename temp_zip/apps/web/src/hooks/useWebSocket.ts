'use client'
import { useEffect, useRef, useCallback } from 'react'

type WSMessage = { type: string; [key: string]: unknown }
type Handler = (msg: WSMessage) => void

export function useWebSocket(url: string, handlers: Record<string, Handler>) {
  const ws = useRef<WebSocket | null>(null)
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const connect = () => {
      ws.current = new WebSocket(url)
      ws.current.onopen = () => ws.current?.send(JSON.stringify({ type: 'PING' }))
      ws.current.onmessage = (e) => {
        try {
          const msg: WSMessage = JSON.parse(e.data)
          handlersRef.current[msg.type]?.(msg)
          handlersRef.current['*']?.(msg)
        } catch {}
      }
      ws.current.onclose = () => setTimeout(connect, 3000)
      ws.current.onerror = () => ws.current?.close()
    }
    connect()
    return () => ws.current?.close()
  }, [url])

  const send = useCallback((msg: WSMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(msg))
  }, [])

  return { send }
}
