'use client'
import { useState } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { casinoApi } from '../../lib/api'
import { useAuthStore } from '../../store'

export default function DicePage() {
  const { user, balance, setBalance } = useAuthStore()
  const [stake, setStake]       = useState('100')
  const [target, setTarget]     = useState(50)
  const [isOver, setIsOver]     = useState(true)
  const [result, setResult]     = useState<number | null>(null)
  const [won, setWon]           = useState<boolean | null>(null)
  const [payout, setPayout]     = useState<number | null>(null)
  const [rolling, setRolling]   = useState(false)
  const [error, setError]       = useState('')
  const [history, setHistory]   = useState<Array<{ roll: number; won: boolean; payout: number }>>([])

  const winChance  = isOver ? (100 - target) : target
  const multiplier = winChance > 0 ? parseFloat(((99 / winChance) * 0.99).toFixed(4)) : 0
  const potentialWin = (parseFloat(stake) * multiplier).toFixed(2)

  async function roll() {
    if (!user) { setError('Please log in to play'); return }
    setRolling(true); setError(''); setResult(null); setWon(null)
    try {
      const { data } = await casinoApi.diceRoll({ betAmount: parseFloat(stake), target, isOver })
      const r = data.data
      setResult(r.roll)
      setWon(r.won)
      setPayout(r.payout ?? 0)
      if (r.won) setBalance(balance + r.payout)
      else setBalance(balance - parseFloat(stake))
      setHistory(prev => [{ roll: r.roll, won: r.won, payout: r.payout ?? 0 }, ...prev.slice(0, 19)])
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Roll failed')
    } finally { setRolling(false) }
  }

  return (
    <Layout hideSidebar>
      <Head><title>Dice — BetPro Casino</title></Head>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>
          🎲 DICE
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>Provably fair. Set your target and roll.</div>

        {/* Result display */}
        <div style={{
          background: won === true ? 'rgba(0,212,170,0.08)' : won === false ? 'rgba(224,63,63,0.08)' : 'var(--bg-card)',
          border: `1px solid ${won === true ? 'var(--accent)' : won === false ? 'var(--live-red)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '40px 24px',
          textAlign: 'center',
          marginBottom: 24,
          transition: 'all 0.3s',
          minHeight: 160,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {result !== null ? (
            <>
              <div style={{
                fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 72,
                color: won ? 'var(--accent)' : 'var(--live-red)',
                lineHeight: 1,
              }}>{result.toFixed(2)}</div>
              <div style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: won ? 'var(--accent)' : 'var(--live-red)' }}>
                {won ? `🎉 YOU WON ₹${payout?.toFixed(2)}!` : '❌ YOU LOST'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {isOver ? `Needed: over ${target}` : `Needed: under ${target}`}
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🎲</div>
              <div>{rolling ? 'Rolling...' : 'Place your bet and roll!'}</div>
            </div>
          )}
        </div>

        {/* Slider */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ROLL UNDER</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{target}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>ROLL OVER</span>
          </div>

          {/* Visual bar */}
          <div style={{ position: 'relative', height: 40, marginBottom: 16 }}>
            <div style={{ position: 'absolute', inset: '14px 0', borderRadius: 4 }}>
              <div style={{ width: '100%', height: 12, background: 'var(--bg-elevated)', borderRadius: 6, position: 'relative' }}>
                {/* Lose zone */}
                <div style={{ position: 'absolute', left: 0, width: `${isOver ? target : 100 - target}%`, height: '100%', background: 'rgba(224,63,63,0.4)', borderRadius: '6px 0 0 6px' }} />
                {/* Win zone */}
                <div style={{ position: 'absolute', right: 0, width: `${isOver ? 100 - target : target}%`, height: '100%', background: 'rgba(0,212,170,0.4)', borderRadius: isOver ? '0 6px 6px 0' : '6px 0 0 6px' }} />
                {/* Result marker */}
                {result !== null && (
                  <div style={{
                    position: 'absolute', left: `${result}%`, top: -4, width: 2, height: 20,
                    background: won ? 'var(--accent)' : 'var(--live-red)',
                    transform: 'translateX(-50%)',
                  }} />
                )}
              </div>
            </div>
            <input
              type="range" min={2} max={98} value={target}
              onChange={e => setTarget(parseInt(e.target.value))}
              style={{ position: 'absolute', inset: 0, width: '100%', opacity: 0, cursor: 'pointer', height: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>

          {/* Over/Under toggle */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => setIsOver(false)} style={{
              flex: 1, padding: '10px', background: !isOver ? 'rgba(224,63,63,0.15)' : 'var(--bg-elevated)',
              border: `1px solid ${!isOver ? 'var(--live-red)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', color: !isOver ? 'var(--live-red)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>ROLL UNDER {target}</button>
            <button onClick={() => setIsOver(true)} style={{
              flex: 1, padding: '10px', background: isOver ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
              border: `1px solid ${isOver ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', color: isOver ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>ROLL OVER {target}</button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { label: 'Win Chance', value: `${winChance.toFixed(2)}%`, color: 'var(--accent)' },
            { label: 'Multiplier', value: `${multiplier}×`, color: 'var(--accent-2)' },
            { label: 'Profit on Win', value: `₹${(parseFloat(stake || '0') * multiplier - parseFloat(stake || '0')).toFixed(2)}`, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Stake + Roll */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Stake (₹)</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>₹</span>
                <input type="number" value={stake} onChange={e => setStake(e.target.value)} style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: '10px 10px 10px 26px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)' }} />
              </div>
              <button onClick={() => setStake(String(parseFloat(stake || '0') / 2))} style={{ padding: '0 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>½</button>
              <button onClick={() => setStake(String(parseFloat(stake || '0') * 2))} style={{ padding: '0 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>2×</button>
            </div>
          </div>
          <button onClick={roll} disabled={rolling || !user} style={{
            padding: '11px 40px', background: rolling ? 'var(--bg-elevated)' : 'var(--accent)',
            color: rolling ? 'var(--text-muted)' : '#000',
            borderRadius: 'var(--radius)', border: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: 0.5,
            cursor: rolling ? 'not-allowed' : 'pointer', minWidth: 140,
          }}>
            {rolling ? '🎲 Rolling...' : '🎲 ROLL'}
          </button>
        </div>

        {error && <div style={{ color: 'var(--live-red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* History */}
        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>Roll History</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {history.map((h, i) => (
                <span key={i} style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: h.won ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)',
                  color: h.won ? 'var(--accent)' : 'var(--live-red)',
                }}>{h.roll.toFixed(2)}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
