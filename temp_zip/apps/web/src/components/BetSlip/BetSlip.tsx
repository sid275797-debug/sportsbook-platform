'use client'
import { useBetSlipStore, useWalletStore } from '../../store'
import { bettingApi } from '../../lib/api'
import { useState } from 'react'

export function BetSlip() {
  const { selections, totalStake, setStake, removeSelection, clearSlip } = useBetSlipStore()
  const { balance } = useWalletStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalOdds = selections.reduce((acc, s) => acc * s.odds, 1)
  const potentialPayout = totalStake * totalOdds

  async function placeBet() {
    if (!selections.length) return
    setLoading(true)
    setError('')
    try {
      await bettingApi.placeBet({
        selections: selections.map((s) => ({ marketId: s.marketId, outcomeId: s.outcomeId, odds: s.odds, stake: totalStake / selections.length })),
        totalStake,
        currency: 'INR',
        type: selections.length > 1 ? 'accumulator' : 'single',
      })
      clearSlip()
      alert('Bet placed successfully!')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to place bet')
    } finally { setLoading(false) }
  }

  if (!selections.length) return (
    <div style={{ padding: '1rem', border: '1px solid #e5e5e5', borderRadius: 8 }}>
      <h3>Bet Slip</h3>
      <p style={{ color: '#888', fontSize: 14 }}>Add selections to place a bet</p>
    </div>
  )

  return (
    <div style={{ padding: '1rem', border: '1px solid #e5e5e5', borderRadius: 8 }}>
      <h3>Bet Slip ({selections.length})</h3>
      {selections.map((sel) => (
        <div key={sel.outcomeId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{sel.outcomeName}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{sel.marketName}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{sel.odds.toFixed(2)}</span>
            <button onClick={() => removeSelection(sel.outcomeId)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ))}
      <hr />
      <div>
        <label style={{ fontSize: 12 }}>Stake (₹)</label>
        <input type="number" value={totalStake} min={10} max={balance}
          onChange={(e) => setStake(Number(e.target.value))}
          style={{ width: '100%', padding: '0.5rem', marginTop: 4, border: '1px solid #ddd', borderRadius: 4 }} />
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
        <span>Total Odds: {totalOdds.toFixed(2)}</span>
        <span>Potential: ₹{potentialPayout.toFixed(2)}</span>
      </div>
      {error && <div style={{ color: 'red', fontSize: 12, marginTop: 8 }}>{error}</div>}
      <button onClick={placeBet} disabled={loading || totalStake > balance}
        style={{ width: '100%', marginTop: 12, padding: '0.75rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
        {loading ? 'Placing...' : `Place Bet ₹${totalStake}`}
      </button>
    </div>
  )
}
