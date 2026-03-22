'use client'
import { useState } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { casinoApi } from '../../lib/api'
import { useAuthStore } from '../../store'

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]
const BET_TYPES = [
  { id: 'red',   label: 'Red',   color: '#e03f3f', payout: '1:1' },
  { id: 'black', label: 'Black', color: '#232830', payout: '1:1' },
  { id: 'odd',   label: 'Odd',   color: '#3b82f6', payout: '1:1' },
  { id: 'even',  label: 'Even',  color: '#8b5cf6', payout: '1:1' },
  { id: 'low',   label: '1–18',  color: '#f0a500', payout: '1:1' },
  { id: 'high',  label: '19–36', color: '#00d4aa', payout: '1:1' },
]

export default function RoulettePage() {
  const { user, balance, setBalance } = useAuthStore()
  const [stake, setStake]   = useState('100')
  const [betType, setBetType] = useState('red')
  const [result, setResult] = useState<number | null>(null)
  const [won, setWon]       = useState<boolean | null>(null)
  const [payout, setPayout] = useState<number | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [error, setError]   = useState('')
  const [history, setHistory] = useState<Array<{ result: number; won: boolean }>>([])

  async function spin() {
    if (!user) { setError('Please log in to play'); return }
    const amt = parseFloat(stake)
    if (!amt || amt < 10) { setError('Min stake is ₹10'); return }
    setSpinning(true); setError('')
    try {
      const { data } = await casinoApi.rouletteSpin({
        bets: [{ betType, amount: amt, numbers: getNumbers(betType) }],
      })
      const roundResult = data.data.round.result
      const myBet = data.data.round.bets?.[0]
      setResult(roundResult)
      setWon(myBet?.won ?? false)
      setPayout(myBet?.payout ?? 0)
      if (myBet?.won) setBalance(balance + myBet.payout - amt)
      else setBalance(balance - amt)
      setHistory(prev => [{ result: roundResult, won: myBet?.won ?? false }, ...prev.slice(0, 19)])
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Spin failed')
    } finally { setSpinning(false) }
  }

  function getNumbers(type: string): number[] {
    switch (type) {
      case 'red':   return RED_NUMBERS
      case 'black': return [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36].filter(n => !RED_NUMBERS.includes(n))
      case 'odd':   return [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35]
      case 'even':  return [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36]
      case 'low':   return Array.from({length:18},(_,i)=>i+1)
      case 'high':  return Array.from({length:18},(_,i)=>i+19)
      default:      return []
    }
  }

  const isRed = result !== null && RED_NUMBERS.includes(result)
  const wheelColor = result === 0 ? '#22c55e' : isRed ? '#e03f3f' : '#1a1a2e'

  return (
    <Layout hideSidebar>
      <Head><title>Roulette — BetPro Casino</title></Head>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>🎡 ROULETTE</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>European roulette. 37 numbers (0–36). Provably fair.</div>

        {/* Wheel result */}
        <div style={{
          background: won === true ? 'rgba(0,212,170,0.08)' : won === false ? 'rgba(224,63,63,0.08)' : 'var(--bg-card)',
          border: `1px solid ${won === true ? 'var(--accent)' : won === false ? 'var(--live-red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)', padding: '40px 24px', textAlign: 'center', marginBottom: 24, minHeight: 160,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {result !== null ? (
            <>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: wheelColor, border: '4px solid var(--border-bright)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 36, color: '#fff',
                marginBottom: 16,
              }}>{result}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: won ? 'var(--accent)' : 'var(--live-red)' }}>
                {won ? `🎉 YOU WON ₹${payout?.toFixed(2)}!` : '❌ YOU LOST'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {result === 0 ? '🟢 Zero' : isRed ? '🔴 Red' : '⚫ Black'} • {result % 2 === 0 ? 'Even' : 'Odd'}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎡</div>
              <div>{spinning ? 'Spinning...' : 'Place your bet and spin!'}</div>
            </div>
          )}
        </div>

        {/* Bet type grid */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Bet Type</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {BET_TYPES.map(bt => (
              <button key={bt.id} onClick={() => setBetType(bt.id)} style={{
                padding: '14px 10px', borderRadius: 'var(--radius)', border: `2px solid ${betType === bt.id ? bt.color : 'var(--border)'}`,
                background: betType === bt.id ? bt.color + '20' : 'var(--bg-elevated)',
                color: betType === bt.id ? bt.color : 'var(--text-secondary)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: bt.color, display: 'block' }} />
                {bt.label}
                <span style={{ fontSize: 10, opacity: 0.7 }}>{bt.payout}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stake + Spin */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Stake (₹)</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>₹</span>
                <input type="number" value={stake} onChange={e => setStake(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: '10px 10px 10px 26px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)' }} />
              </div>
              {[100,500,1000,5000].map(v => (
                <button key={v} onClick={() => setStake(String(v))} style={{ padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  ₹{v>=1000?`${v/1000}k`:v}
                </button>
              ))}
            </div>
          </div>
          <button onClick={spin} disabled={spinning || !user} style={{
            padding: '11px 40px', background: spinning ? 'var(--bg-elevated)' : 'var(--accent)',
            color: spinning ? 'var(--text-muted)' : '#000', borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: 0.5,
            cursor: spinning ? 'not-allowed' : 'pointer', minWidth: 140, border: 'none',
          }}>
            {spinning ? '🎡 Spinning...' : '🎡 SPIN'}
          </button>
        </div>

        {error && <div style={{ color: 'var(--live-red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>History</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {history.map((h, i) => {
                const isR = RED_NUMBERS.includes(h.result)
                const bg = h.result === 0 ? '#22c55e' : isR ? '#e03f3f' : '#232830'
                return (
                  <span key={i} style={{
                    width: 36, height: 36, borderRadius: '50%', background: bg,
                    border: `2px solid ${h.won ? 'var(--accent)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, color: '#fff',
                  }}>{h.result}</span>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
