'use client'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { bettingApi } from '../lib/api'
import { useAuthStore } from '../store'

interface Selection { id: string; marketName: string; outcomeName: string; odds: number; status?: string }
interface Bet {
  id: string
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'PARTIALLY_WON'
  totalOdds: number
  totalStake: number
  potentialPayout: number
  actualPayout?: number
  createdAt: string
  settledAt?: string
  selections: Selection[]
  type: 'SINGLE' | 'ACCUMULATOR'
}

const STATUS_FILTER = ['ALL', 'PENDING', 'WON', 'LOST', 'VOID']

export default function MyBets() {
  const { user } = useAuthStore()
  const [bets, setBets]           = useState<Bet[]>([])
  const [filter, setFilter]       = useState('ALL')
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    bettingApi.myBets().then(r => setBets(r.data.data ?? [])).finally(() => setLoading(false))
  }, [user])

  const filtered = filter === 'ALL' ? bets : bets.filter(b => b.status === filter)

  const stats = {
    total:   bets.length,
    won:     bets.filter(b => b.status === 'WON').length,
    pending: bets.filter(b => b.status === 'PENDING').length,
    staked:  bets.reduce((s, b) => s + b.totalStake, 0),
    returns: bets.filter(b => b.status === 'WON').reduce((s, b) => s + (b.actualPayout ?? 0), 0),
  }

  return (
    <Layout>
      <Head><title>My Bets — BetPro</title></Head>
      <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 20 }}>MY BETS</div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--text-primary)' },
            { label: 'Won', value: stats.won, color: '#22c55e' },
            { label: 'Pending', value: stats.pending, color: '#f0a500' },
            { label: 'Staked', value: `₹${stats.staked.toLocaleString('en-IN')}`, color: 'var(--accent-2)' },
            { label: 'Returns', value: `₹${stats.returns.toLocaleString('en-IN')}`, color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {STATUS_FILTER.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 16px', borderRadius: 20,
              background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === f ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              {f} {f !== 'ALL' && `(${bets.filter(b => b.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Bets list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
            <div style={{ marginBottom: 12 }}>{filter === 'ALL' ? 'No bets placed yet' : `No ${filter.toLowerCase()} bets`}</div>
            <Link href="/sportsbook" style={{ color: 'var(--accent)' }}>Browse markets →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(b => (
              <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {/* Bet header */}
                <button onClick={() => setExpanded(expanded === b.id ? null : b.id)} style={{
                  display: 'flex', width: '100%', background: 'none', border: 'none',
                  padding: '14px 16px', cursor: 'pointer', gap: 16, alignItems: 'center',
                }}>
                  {/* Type badge */}
                  <span style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {b.type ?? (b.selections?.length > 1 ? 'ACCA' : 'SINGLE')}
                  </span>

                  {/* Date */}
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Selections preview */}
                  <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.selections?.[0]?.outcomeName ?? '—'}
                    {b.selections?.length > 1 && ` +${b.selections.length - 1} more`}
                  </span>

                  {/* Stake / Odds / Return */}
                  <div style={{ display: 'flex', gap: 20, flexShrink: 0, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>STAKE</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>₹{b.totalStake}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ODDS</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>{b.totalOdds?.toFixed(2)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{b.status === 'WON' ? 'PAYOUT' : 'POTENTIAL'}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: b.status === 'WON' ? '#22c55e' : 'var(--text-primary)' }}>
                        ₹{(b.status === 'WON' ? b.actualPayout : b.potentialPayout)?.toFixed(0) ?? '—'}
                      </div>
                    </div>
                    <StatusBadge status={b.status} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 10, transform: expanded === b.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▼</span>
                  </div>
                </button>

                {/* Expanded selections */}
                {expanded === b.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
                    {b.selections?.map((sel, i) => (
                      <div key={sel.id ?? i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: i < b.selections.length - 1 ? '1px solid var(--border)' : 'none',
                        fontSize: 13,
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sel.outcomeName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sel.marketName}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700 }}>{sel.odds?.toFixed(2)}</span>
                          {sel.status && <StatusBadge status={sel.status} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    WON:          { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
    LOST:         { bg: 'rgba(224,63,63,0.12)',    color: '#e03f3f' },
    PENDING:      { bg: 'rgba(240,165,0,0.12)',    color: '#f0a500' },
    VOID:         { bg: 'rgba(255,255,255,0.06)',  color: 'var(--text-muted)' },
    PARTIALLY_WON:{ bg: 'rgba(59,130,246,0.12)',   color: '#3b82f6' },
    SETTLED:      { bg: 'rgba(0,212,170,0.12)',    color: '#00d4aa' },
  }
  const s = map[status] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, flexShrink: 0 }}>
      {status}
    </span>
  )
}
