import Head from 'next/head'
import { useState, useEffect, useRef } from 'react'
import Layout from '../../components/Layout'
import { useWebSocket } from '../../hooks/useWebSocket'
import { casinoApi } from '../../lib/api'
import { useAuthStore } from '../../store'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3006/ws'

type Status = 'waiting' | 'running' | 'crashed'

interface BetEntry { username: string; stake: number; multiplier?: number; payout?: number }

export default function CrashPage() {
  const [multiplier, setMultiplier]   = useState(1.0)
  const [status, setStatus]           = useState<Status>('waiting')
  const [stake, setStake]             = useState('100')
  const [autoCashout, setAutoCashout] = useState('')
  const [activeBet, setActiveBet]     = useState<any>(null)
  const [history, setHistory]         = useState<number[]>([])
  const [liveBets, setLiveBets]       = useState<BetEntry[]>([])
  const [error, setError]             = useState('')
  const [countdown, setCountdown]     = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { user } = useAuthStore()

  const { send } = useWebSocket(WS_URL, {
    CONNECTED: () => {
      // Authenticate so server knows who this client is
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      if (token) send({ type: 'AUTH', token })
    },
    WAITING: (msg: any) => {
      setStatus('waiting')
      setMultiplier(1.0)
      setCountdown(msg.countdown ?? 5)
    },
    ROUND_START: () => { setStatus('running'); setCountdown(0) },
    MULTIPLIER: (msg: any) => {
      setMultiplier(msg.value as number)
      // auto cashout
      if (autoCashout && parseFloat(autoCashout) > 0 && msg.value >= parseFloat(autoCashout) && activeBet) {
        handleCashout()
      }
    },
    CRASHED: (msg: any) => {
      setStatus('crashed')
      setHistory(prev => [msg.multiplier as number, ...prev.slice(0, 29)])
      setActiveBet(null)
    },
    BET_PLACED: (msg: any) => {
      setLiveBets(prev => [{ username: msg.username, stake: msg.stake }, ...prev.slice(0, 49)])
    },
    CASHOUT: (msg: any) => {
      setLiveBets(prev => prev.map(b =>
        b.username === msg.username ? { ...b, multiplier: msg.multiplier, payout: msg.payout } : b
      ))
    },
  })

  // Draw curve on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)

    if (status === 'crashed') {
      ctx.fillStyle = 'rgba(224,63,63,0.05)'
      ctx.fillRect(0, 0, W, H)
    }

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(0, (H / 4) * i); ctx.lineTo(W, (H / 4) * i); ctx.stroke()
      ctx.beginPath(); ctx.moveTo((W / 4) * i, 0); ctx.lineTo((W / 4) * i, H); ctx.stroke()
    }

    if (status === 'waiting') {
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.font = '14px Barlow'
      ctx.textAlign = 'center'
      ctx.fillText('Waiting for next round...', W / 2, H / 2)
      return
    }

    // Curve
    const progress = Math.min((multiplier - 1) / 9, 1)
    const endX = progress * (W - 60) + 30
    const endY = H - 40 - progress * (H - 80)

    const color = status === 'crashed' ? '#e03f3f' : multiplier > 5 ? '#f0a500' : '#00d4aa'

    ctx.beginPath()
    ctx.moveTo(30, H - 40)
    ctx.quadraticCurveTo(endX * 0.3, H - 40, endX, endY)
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.shadowColor = color
    ctx.shadowBlur = 12
    ctx.stroke()
    ctx.shadowBlur = 0

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, color + '30')
    grad.addColorStop(1, 'transparent')
    ctx.beginPath()
    ctx.moveTo(30, H - 40)
    ctx.quadraticCurveTo(endX * 0.3, H - 40, endX, endY)
    ctx.lineTo(endX, H - 40)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Dot at tip
    ctx.beginPath()
    ctx.arc(endX, endY, 6, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  }, [multiplier, status])

  async function handleBet() {
    setError('')
    try {
      const { data: current } = await casinoApi.crashCurrent()
      const bet = await casinoApi.crashBet({ stake: parseFloat(stake), roundId: current.data.roundId })
      setActiveBet(bet.data.data)
    } catch (err: any) { setError(err.response?.data?.error ?? 'Failed to place bet') }
  }

  async function handleCashout() {
    if (!activeBet) return
    try {
      const { data: current } = await casinoApi.crashCurrent()
      const result = await casinoApi.crashCashout({ roundId: current.data.roundId })
      setActiveBet(null)
    } catch (err: any) { setError(err.response?.data?.error ?? 'Cash out failed') }
  }

  const mult = multiplier.toFixed(2)
  const displayColor = status === 'crashed' ? '#e03f3f' : status === 'running' && multiplier > 5 ? '#f0a500' : '#00d4aa'

  return (
    <Layout hideSidebar>
      <Head><title>Crash — BetPro Casino</title></Head>
      <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-height))', background: 'var(--bg-base)' }}>

        {/* ── LEFT: GAME ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* History bar */}
          <div style={{
            display: 'flex', gap: 6, padding: '8px 16px',
            background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
            overflowX: 'auto', alignItems: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>History:</span>
            {history.map((m, i) => (
              <span key={i} style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--font-mono)', flexShrink: 0,
                background: m < 2 ? 'rgba(224,63,63,0.15)' : m >= 10 ? 'rgba(240,165,0,0.15)' : 'rgba(0,212,170,0.1)',
                color: m < 2 ? '#e03f3f' : m >= 10 ? '#f0a500' : '#00d4aa',
              }}>{m.toFixed(2)}×</span>
            ))}
            {history.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No rounds yet</span>}
          </div>

          {/* Canvas */}
          <div style={{
            flex: 1, position: 'relative', background: '#0c0f14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <canvas ref={canvasRef} width={800} height={400}
              style={{ width: '100%', height: '100%', maxHeight: 400 }} />

            {/* Multiplier overlay */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              {status === 'waiting' ? (
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--text-muted)', marginBottom: 8 }}>
                    NEXT ROUND IN
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 64, fontWeight: 800, color: 'var(--accent)' }}>
                    {countdown}s
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Place your bets!</div>
                </div>
              ) : (
                <div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 800,
                    fontSize: status === 'crashed' ? 52 : 72,
                    color: displayColor,
                    textShadow: `0 0 30px ${displayColor}80`,
                    lineHeight: 1,
                  }}>
                    {mult}×
                  </div>
                  {status === 'crashed' && (
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800,
                      color: '#e03f3f', marginTop: 8, letterSpacing: 2,
                    }}>CRASHED!</div>
                  )}
                  {activeBet && status === 'running' && (
                    <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 8 }}>
                      Profit: +₹{((parseFloat(stake) * multiplier) - parseFloat(stake)).toFixed(0)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bet controls */}
          <div style={{
            background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
            padding: '16px', display: 'flex', gap: 12, alignItems: 'flex-end', flexShrink: 0,
          }}>
            {/* Stake */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Stake (₹)
              </label>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>₹</span>
                  <input
                    type="number" value={stake} onChange={e => setStake(e.target.value)}
                    disabled={!!activeBet}
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                      borderRadius: 'var(--radius)', padding: '10px 10px 10px 26px',
                      color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)',
                    }}
                  />
                </div>
                {[100, 500, 1000, 5000].map(v => (
                  <button key={v} onClick={() => setStake(String(v))} disabled={!!activeBet} style={{
                    padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>₹{v >= 1000 ? `${v/1000}k` : v}</button>
                ))}
              </div>
            </div>

            {/* Auto cashout */}
            <div style={{ width: 130 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Auto Cashout
              </label>
              <input
                type="number" step="0.1" min="1.1" value={autoCashout}
                onChange={e => setAutoCashout(e.target.value)}
                placeholder="e.g. 2.00"
                style={{
                  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                  borderRadius: 'var(--radius)', padding: '10px 12px',
                  color: 'var(--text-primary)', fontSize: 14,
                }}
              />
            </div>

            {/* Bet/Cashout button */}
            <div>
              {!activeBet ? (
                <button
                  onClick={handleBet}
                  disabled={status === 'crashed' || !user}
                  style={{
                    padding: '11px 32px',
                    background: status === 'waiting' ? 'var(--accent)' : status === 'running' ? 'var(--accent-2)' : 'var(--bg-elevated)',
                    color: status === 'crashed' ? 'var(--text-muted)' : '#000',
                    borderRadius: 'var(--radius)', border: 'none',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: 0.5,
                    cursor: status === 'crashed' ? 'not-allowed' : 'pointer',
                    minWidth: 140,
                  }}
                >
                  {!user ? 'LOGIN TO BET' : status === 'waiting' ? 'PLACE BET' : status === 'running' ? 'BET (NEXT)' : 'CRASHED'}
                </button>
              ) : (
                <button
                  onClick={handleCashout}
                  disabled={status !== 'running'}
                  style={{
                    padding: '11px 32px',
                    background: status === 'running' ? '#22c55e' : 'var(--bg-elevated)',
                    color: '#000',
                    borderRadius: 'var(--radius)', border: 'none',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: 0.5,
                    cursor: status === 'running' ? 'pointer' : 'not-allowed',
                    minWidth: 140,
                    animation: status === 'running' ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  CASH OUT {mult}×
                </button>
              )}
            </div>

            {error && (
              <div style={{ color: 'var(--live-red)', fontSize: 12, alignSelf: 'center' }}>{error}</div>
            )}
          </div>
        </div>

        {/* ── RIGHT: LIVE BETS ── */}
        <div style={{
          width: 280, background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--border)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span className="live-dot" />
            LIVE BETS
            <span style={{
              background: 'var(--bg-elevated)', borderRadius: 10,
              fontSize: 11, padding: '1px 7px', color: 'var(--text-muted)',
            }}>{liveBets.length}</span>
          </div>

          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 70px 70px',
            padding: '8px 16px', borderBottom: '1px solid var(--border)',
            fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase',
          }}>
            <span>Player</span><span style={{ textAlign: 'right' }}>Bet</span><span style={{ textAlign: 'right' }}>Mult</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {liveBets.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 16px', fontSize: 12 }}>
                No bets yet this round
              </div>
            ) : (
              liveBets.map((b, i) => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '1fr 70px 70px',
                  padding: '8px 16px', borderBottom: '1px solid var(--border)',
                  fontSize: 12,
                  background: b.payout ? 'rgba(0,212,170,0.05)' : 'transparent',
                }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.username}
                  </span>
                  <span style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                    ₹{b.stake}
                  </span>
                  <span style={{
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)', fontWeight: 700,
                    color: b.multiplier ? '#00d4aa' : 'var(--text-muted)',
                  }}>
                    {b.multiplier ? `${b.multiplier.toFixed(2)}×` : '—'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Provably fair */}
          <div style={{
            padding: '12px 16px', borderTop: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
          }}>
            🔐 Provably Fair — verify any round
          </div>
        </div>
      </div>
    </Layout>
  )
}
