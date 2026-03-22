import React, { useState } from 'react'
import { useBetslipStore } from '../store'
import { bettingApi } from '../lib/api'

export default function Betslip() {
  const { selections, removeSelection, clearAll } = useBetslipStore()
  const [stakes, setStakes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const total = selections.reduce((sum, s) => {
    const stake = parseFloat(stakes[s.outcomeId] || '0')
    return sum + stake
  }, 0)

  const potentialWin = selections.reduce((sum, s) => {
    const stake = parseFloat(stakes[s.outcomeId] || '0')
    return sum + stake * s.odds
  }, 0)

  async function placeBet() {
    const bets = selections.map(s => ({
      fixtureId: s.fixtureId,
      marketId: s.marketId,
      outcomeId: s.outcomeId,
      stake: parseFloat(stakes[s.outcomeId] || '0'),
      odds: s.odds,
    })).filter(b => b.stake > 0)

    if (bets.length === 0) return
    setLoading(true)
    setMessage(null)
    try {
      await bettingApi.placeBet({ bets })
      setMessage({ type: 'success', text: 'Bet placed successfully!' })
      clearAll()
      setStakes({})
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error ?? 'Failed to place bet' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      width: 280,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - var(--nav-height))',
      position: 'sticky',
      top: 'var(--nav-height)',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>
            BET SLIP
          </span>
          {selections.length > 0 && (
            <span style={{
              background: 'var(--accent)',
              color: '#000',
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 700,
              padding: '1px 7px',
            }}>{selections.length}</span>
          )}
        </div>
        {selections.length > 0 && (
          <button
            onClick={clearAll}
            style={{
              background: 'none',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >Clear all</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {['Singles', 'Accumulator'].map((t, i) => (
          <button key={t} style={{
            flex: 1,
            padding: '9px 0',
            background: 'none',
            color: i === 0 ? 'var(--accent)' : 'var(--text-muted)',
            borderBottom: i === 0 ? '2px solid var(--accent)' : '2px solid transparent',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.4,
          }}>{t}</button>
        ))}
      </div>

      {/* Selections */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {selections.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 200,
            gap: 12,
            color: 'var(--text-muted)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-7-7 7V5a2 2 0 012-2h10a2 2 0 012 2z"/>
            </svg>
            <span style={{ fontSize: 13 }}>Your betslip is empty</span>
            <span style={{ fontSize: 11, textAlign: 'center', maxWidth: 160 }}>
              Click any odds to add selections
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selections.map(s => (
              <div key={s.outcomeId} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--accent)',
                      marginTop: 3,
                    }}>{s.odds.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => removeSelection(s.outcomeId)}
                    style={{ background: 'none', color: 'var(--text-muted)', fontSize: 16, padding: '0 0 0 8px' }}
                  >×</button>
                </div>
                {/* Stake input */}
                <div style={{ marginTop: 8, position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', fontSize: 13,
                  }}>₹</span>
                  <input
                    type="number"
                    placeholder="Stake"
                    value={stakes[s.outcomeId] ?? ''}
                    onChange={e => setStakes(prev => ({ ...prev, [s.outcomeId]: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-bright)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px 6px 22px',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                </div>
                {stakes[s.outcomeId] && parseFloat(stakes[s.outcomeId]) > 0 && (
                  <div style={{ marginTop: 5, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Potential win</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      ₹{(parseFloat(stakes[s.outcomeId]) * s.odds).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {selections.length > 0 && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          {message && (
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 10,
              fontSize: 12,
              fontWeight: 500,
              background: message.type === 'success' ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)',
              color: message.type === 'success' ? 'var(--accent)' : 'var(--live-red)',
              border: `1px solid ${message.type === 'success' ? 'var(--accent-dim)' : 'var(--live-red)'}`,
            }}>{message.text}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>Total stake</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{total.toLocaleString('en-IN')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 12 }}>
            <span style={{ color: 'var(--text-muted)' }}>Potential return</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
              ₹{potentialWin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={placeBet}
            disabled={loading || total === 0}
            style={{
              width: '100%',
              padding: '12px',
              background: total === 0 ? 'var(--bg-elevated)' : 'var(--accent)',
              color: total === 0 ? 'var(--text-muted)' : '#000',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: 0.5,
              transition: 'all 0.15s',
            }}
          >
            {loading ? 'PLACING BET...' : 'PLACE BET'}
          </button>
        </div>
      )}
    </div>
  )
}
