import React, { useEffect, useRef, useState } from 'react'
import { useBetslipStore } from '../store'

interface OddsButtonProps {
  fixtureId: string
  marketId: string
  outcomeId: string
  label: string
  odds: number
  suspended?: boolean
}

export default function OddsButton({
  fixtureId, marketId, outcomeId, label, odds, suspended = false,
}: OddsButtonProps) {
  const { addSelection, removeSelection, isSelected } = useBetslipStore()
  const selected = isSelected(outcomeId)
  const prevOdds = useRef(odds)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (odds !== prevOdds.current) {
      setFlash(odds > prevOdds.current ? 'up' : 'down')
      prevOdds.current = odds
      const t = setTimeout(() => setFlash(null), 900)
      return () => clearTimeout(t)
    }
  }, [odds])

  function handleClick() {
    if (suspended) return
    if (selected) {
      removeSelection(outcomeId)
    } else {
      addSelection({ fixtureId, marketId, outcomeId, label, odds })
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={suspended}
      className={flash === 'up' ? 'odds-up' : flash === 'down' ? 'odds-down' : ''}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 10px',
        minWidth: 72,
        background: selected ? 'var(--accent)' : 'var(--odds-bg)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border-bright)'}`,
        borderRadius: 'var(--radius-sm)',
        cursor: suspended ? 'not-allowed' : 'pointer',
        opacity: suspended ? 0.4 : 1,
        transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
        gap: 2,
      }}
      onMouseEnter={e => {
        if (!selected && !suspended)
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--odds-hover)'
      }}
      onMouseLeave={e => {
        if (!selected && !suspended)
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--odds-bg)'
      }}
    >
      <span style={{
        fontSize: 10,
        color: selected ? '#000' : 'var(--text-muted)',
        fontWeight: 500,
        letterSpacing: 0.3,
      }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontWeight: 600,
        fontSize: 14,
        color: selected ? '#000' : 'var(--accent)',
      }}>
        {suspended ? '—' : odds.toFixed(2)}
      </span>
    </button>
  )
}
