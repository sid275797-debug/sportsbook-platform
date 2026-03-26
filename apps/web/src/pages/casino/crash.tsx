import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import { casinoApi, walletApi } from '../../lib/api'

export default function CrashPage() {
  const { user, balance, setBalance } = useAuthStore()
  const [betAmount, setBetAmount] = useState('100')
  const [autoCashout, setAutoCashout] = useState('2.00')
  const [multiplier, setMultiplier] = useState(1.0)
  const [gameState, setGameState] = useState<'waiting' | 'running' | 'crashed'>('waiting')
  const [betPlaced, setBetPlaced] = useState(false)
  const [cashedOut, setCashedOut] = useState(false)
  const [cashoutAt, setCashoutAt] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const animRef = useRef<number>(0)

  useEffect(() => {
    casinoApi.crashHistory().then(r => {
      const d = r.data?.data ?? r.data ?? []
      setHistory(Array.isArray(d) ? d.slice(0, 20) : [])
    }).catch(() => {})
  }, [])

  // Simulate multiplier increase (in production this comes from WebSocket)
  useEffect(() => {
    if (gameState !== 'running') return
    const start = Date.now()
    const tick = () => {
      const elapsed = (Date.now() - start) / 1000
      const m = Math.pow(Math.E, 0.06 * elapsed)
      setMultiplier(parseFloat(m.toFixed(2)))

      // Auto cashout
      if (betPlaced && !cashedOut && parseFloat(autoCashout) > 0 && m >= parseFloat(autoCashout)) {
        handleCashout()
        return
      }

      // Random crash between 1.1x and 15x
      const crashPoint = 1.1 + Math.random() * 13.9
      if (m >= crashPoint) {
        setGameState('crashed')
        if (betPlaced && !cashedOut) {
          setMessage(`Crashed at ${m.toFixed(2)}x! You lost ₹${betAmount}`)
        }
        setTimeout(() => {
          setGameState('waiting')
          setMultiplier(1.0)
          setBetPlaced(false)
          setCashedOut(false)
          setCashoutAt(null)
        }, 3000)
        return
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [gameState])

  async function handleBet() {
    if (!user) { setMessage('Please log in'); return }
    const amt = parseFloat(betAmount)
    if (!amt || amt < 10) { setMessage('Minimum bet is ₹10'); return }
    setLoading(true); setMessage('')
    try {
      await casinoApi.crashBet({ amount: amt, autoCashout: parseFloat(autoCashout) || undefined })
      setBetPlaced(true)
      setCashedOut(false)
      setGameState('running')
      try {
        const bal = await walletApi.balance()
        setBalance(bal.data.data?.available ?? bal.data.available ?? 0)
      } catch {}
    } catch (err: any) {
      setMessage(err.response?.data?.error ?? 'Bet failed')
    } finally { setLoading(false) }
  }

  async function handleCashout() {
    if (cashedOut) return
    setCashedOut(true)
    setCashoutAt(multiplier)
    const winnings = parseFloat(betAmount) * multiplier
    setMessage(`Cashed out at ${multiplier.toFixed(2)}x! Won ₹${winnings.toFixed(0)}`)
    try {
      const bal = await walletApi.balance()
      setBalance(bal.data.data?.available ?? bal.data.available ?? 0)
    } catch {}
  }

  const multiplierColor = multiplier >= 5 ? '#e03f3f' : multiplier >= 2 ? '#f0a500' : 'var(--accent)'

  return (
    <Layout>
      <Head><title>Crash — BetPro Casino</title></Head>
      <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>
          🚀 CRASH
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          {/* Game area */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center',
            minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            {gameState === 'waiting' && (
              <div>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-muted)' }}>
                  Place your bet to start
                </div>
              </div>
            )}
            {gameState === 'running' && (
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 72,
                  color: multiplierColor, lineHeight: 1, marginBottom: 16,
                  textShadow: `0 0 30px ${multiplierColor}40`,
                }}>
                  {multiplier.toFixed(2)}x
                </div>
                {betPlaced && !cashedOut && (
                  <button onClick={handleCashout} style={{
                    background: 'var(--accent)', color: '#000', padding: '14px 40px',
                    borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)',
                    fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
                  }}>CASH OUT</button>
                )}
                {cashedOut && (
                  <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>
                    Cashed out at {cashoutAt?.toFixed(2)}x
                  </div>
                )}
              </div>
            )}
            {gameState === 'crashed' && (
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 60,
                  color: 'var(--live-red)', lineHeight: 1,
                }}>CRASHED</div>
                <div style={{ fontSize: 24, color: 'var(--text-muted)', marginTop: 8 }}>
                  at {multiplier.toFixed(2)}x
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div>
              <label style={labelStyle}>Bet Amount (₹)</label>
              <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)}
                style={inputStyle} min="10" />
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                {[100, 500, 1000, 5000].map(a => (
                  <button key={a} onClick={() => setBetAmount(String(a))} style={{
                    flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 4, padding: '4px', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
                  }}>₹{a}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Auto Cashout (x)</label>
              <input type="number" value={autoCashout} onChange={e => setAutoCashout(e.target.value)}
                style={inputStyle} min="1.01" step="0.01" />
            </div>

            <button onClick={handleBet} disabled={loading || gameState === 'running'} style={{
              padding: '14px',
              background: (loading || gameState === 'running') ? 'var(--bg-elevated)' : 'var(--accent)',
              color: (loading || gameState === 'running') ? 'var(--text-muted)' : '#000',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            }}>
              {loading ? 'PLACING...' : gameState === 'running' ? 'IN PROGRESS' : 'PLACE BET'}
            </button>

            {message && (
              <div style={{ fontSize: 12, color: message.includes('Won') ? 'var(--accent)' : 'var(--live-red)', fontWeight: 600 }}>
                {message}
              </div>
            )}

            {/* History */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' as const }}>
                Recent Crashes
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {history.slice(0, 12).map((h: any, i: number) => {
                  const v = h.crashPoint ?? h.multiplier ?? (1 + Math.random() * 10)
                  return (
                    <span key={i} style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
                      padding: '2px 6px', borderRadius: 3,
                      background: v >= 2 ? 'rgba(0,212,170,0.15)' : 'rgba(224,63,63,0.15)',
                      color: v >= 2 ? 'var(--accent)' : 'var(--live-red)',
                    }}>{v.toFixed(2)}x</span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
  color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
  borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)',
  fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none',
}
