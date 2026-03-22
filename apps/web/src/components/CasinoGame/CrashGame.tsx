'use client'
import { useState, useEffect } from 'react'
import { useWebSocket } from '../../hooks/useWebSocket'
import { casinoApi } from '../../lib/api'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3006/ws'

export function CrashGame() {
  const [multiplier, setMultiplier] = useState(1.0)
  const [status, setStatus] = useState<'waiting' | 'running' | 'crashed'>('waiting')
  const [stake, setStake] = useState(100)
  const [activeBet, setActiveBet] = useState<any>(null)
  const [history, setHistory] = useState<number[]>([])
  const [error, setError] = useState('')

  const { send } = useWebSocket(WS_URL, {
    WAITING: () => { setStatus('waiting'); setMultiplier(1.0) },
    ROUND_START: () => setStatus('running'),
    MULTIPLIER: (msg) => setMultiplier(msg.value as number),
    CRASHED: (msg) => {
      setStatus('crashed')
      setHistory((prev) => [msg.multiplier as number, ...prev.slice(0, 19)])
      setActiveBet(null)
    },
  })

  async function placeBet() {
    setError('')
    try {
      const { data: current } = await casinoApi.crashCurrent()
      const bet = await casinoApi.crashBet({ stake, roundId: current.data.roundId })
      setActiveBet(bet.data.data)
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to place bet') }
  }

  async function cashOut() {
    if (!activeBet) return
    try {
      const { data: current } = await casinoApi.crashCurrent()
      const result = await casinoApi.crashCashout({ roundId: current.data.roundId })
      alert(`Cashed out at ${result.data.data.multiplier}x — Payout: ₹${result.data.data.payout}`)
      setActiveBet(null)
    } catch (err: any) { setError(err.response?.data?.error ?? 'Cash out failed') }
  }

  const color = status === 'crashed' ? '#ef4444' : status === 'running' && multiplier > 2 ? '#22c55e' : '#2563eb'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '1rem' }}>
      <h2>Crash</h2>
      <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f9fa', borderRadius: 12, marginBottom: '1rem' }}>
        <div style={{ fontSize: 64, fontWeight: 700, color, fontFamily: 'monospace' }}>
          {status === 'waiting' ? 'Starting...' : status === 'crashed' ? `${multiplier.toFixed(2)}x CRASHED` : `${multiplier.toFixed(2)}x`}
        </div>
        {status === 'waiting' && <div style={{ color: '#888', marginTop: 8 }}>Place your bets!</div>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input type="number" value={stake} min={10} onChange={(e) => setStake(Number(e.target.value))}
          style={{ flex: 1, padding: '0.75rem', border: '1px solid #ddd', borderRadius: 6 }} placeholder="Stake (₹)" />
        {!activeBet ? (
          <button onClick={placeBet} disabled={status !== 'waiting' && status !== 'running'}
            style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Bet
          </button>
        ) : (
          <button onClick={cashOut} disabled={status !== 'running'}
            style={{ padding: '0.75rem 1.5rem', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 700 }}>
            Cash Out {multiplier.toFixed(2)}x
          </button>
        )}
      </div>
      {error && <div style={{ color: 'red', fontSize: 13, marginBottom: 8 }}>{error}</div>}
      <div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>Recent crashes</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {history.map((m, i) => (
            <span key={i} style={{ padding: '2px 10px', borderRadius: 20, fontSize: 13, background: m < 2 ? '#fee2e2' : '#dcfce7', color: m < 2 ? '#991b1b' : '#166534', fontWeight: 600 }}>
              {m.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
