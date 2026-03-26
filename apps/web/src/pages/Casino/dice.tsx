import { useState } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import { casinoApi, walletApi } from '../../lib/api'

export default function DicePage() {
  const { user, setBalance } = useAuthStore()
  const [betAmount, setBetAmount] = useState('100')
  const [target, setTarget] = useState(50)
  const [direction, setDirection] = useState<'over' | 'under'>('over')
  const [result, setResult] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'win' | 'loss' | 'error'; text: string } | null>(null)

  const winChance = direction === 'over' ? (100 - target) : target
  const multiplier = winChance > 0 ? parseFloat((98 / winChance).toFixed(4)) : 0
  const payout = parseFloat(betAmount || '0') * multiplier

  async function handleBet() {
    if (!user) { setMessage({ type: 'error', text: 'Please log in' }); return }
    const amt = parseFloat(betAmount)
    if (!amt || amt < 10) { setMessage({ type: 'error', text: 'Minimum bet is ₹10' }); return }
    setLoading(true); setMessage(null); setResult(null)
    try {
      const res = await casinoApi.diceBet({ amount: amt, target, direction })
      const data = res.data?.data ?? res.data
      const roll = data?.result ?? data?.roll ?? Math.floor(Math.random() * 100)
      setResult(roll)
      const won = direction === 'over' ? roll > target : roll < target
      if (won) {
        setMessage({ type: 'win', text: `Rolled ${roll}! You won ₹${(amt * multiplier).toFixed(0)}` })
      } else {
        setMessage({ type: 'loss', text: `Rolled ${roll}. You lost ₹${amt}` })
      }
      try {
        const bal = await walletApi.balance()
        setBalance(bal.data.data?.available ?? bal.data.available ?? 0)
      } catch {}
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error ?? 'Bet failed' })
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <Head><title>Dice — BetPro Casino</title></Head>
      <div style={{ padding: '24px', maxWidth: 700, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>
          🎲 DICE
        </div>

        {/* Result display */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', marginBottom: 16,
        }}>
          {result !== null ? (
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 72,
              color: message?.type === 'win' ? 'var(--accent)' : 'var(--live-red)',
              lineHeight: 1,
            }}>{result}</div>
          ) : (
            <div style={{
              fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 72,
              color: 'var(--text-muted)', lineHeight: 1,
            }}>?</div>
          )}
          <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)' }}>
            Roll {direction} {target}
          </div>
        </div>

        {/* Slider */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px', marginBottom: 16,
        }}>
          <input type="range" min="2" max="98" value={target}
            onChange={e => setTarget(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target: <strong>{target}</strong></span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Win Chance: <strong style={{ color: 'var(--accent)' }}>{winChance}%</strong>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Multiplier: <strong style={{ color: 'var(--accent)' }}>{multiplier}x</strong>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <button onClick={() => setDirection('under')} style={{
            padding: '14px',
            background: direction === 'under' ? 'var(--accent-glow)' : 'var(--bg-card)',
            border: `1px solid ${direction === 'under' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            color: direction === 'under' ? 'var(--accent)' : 'var(--text-secondary)',
          }}>ROLL UNDER {target}</button>
          <button onClick={() => setDirection('over')} style={{
            padding: '14px',
            background: direction === 'over' ? 'var(--accent-glow)' : 'var(--bg-card)',
            border: `1px solid ${direction === 'over' ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16,
            color: direction === 'over' ? 'var(--accent)' : 'var(--text-secondary)',
          }}>ROLL OVER {target}</button>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' as const }}>
              Bet Amount (₹)
            </label>
            <input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                borderRadius: 'var(--radius-sm)', padding: '10px 12px', color: 'var(--text-primary)',
                fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none',
              }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' as const }}>
              Potential Payout
            </label>
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--accent)',
            }}>₹{payout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          </div>
        </div>

        <button onClick={handleBet} disabled={loading} style={{
          width: '100%', padding: '14px',
          background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
          color: loading ? 'var(--text-muted)' : '#000',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
        }}>
          {loading ? 'ROLLING...' : 'ROLL DICE'}
        </button>

        {message && (
          <div style={{
            marginTop: 12, padding: '12px', borderRadius: 'var(--radius)',
            background: message.type === 'win' ? 'rgba(0,212,170,0.1)' : message.type === 'loss' ? 'rgba(224,63,63,0.1)' : 'rgba(240,165,0,0.1)',
            color: message.type === 'win' ? 'var(--accent)' : message.type === 'loss' ? 'var(--live-red)' : 'var(--accent-2)',
            fontSize: 14, fontWeight: 600, textAlign: 'center',
          }}>{message.text}</div>
        )}
      </div>
    </Layout>
  )
}
