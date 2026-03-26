import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import { bettingApi } from '../lib/api'

export default function BetsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [bets, setBets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    async function load() {
      try {
        const params: any = { limit: 50 }
        if (filter !== 'all') params.status = filter
        const res = await bettingApi.myBets(params)
        const d = res.data?.data ?? res.data ?? []
        setBets(Array.isArray(d) ? d : [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [user, router, filter])

  if (!user) return null

  return (
    <Layout>
      <Head><title>My Bets — BetPro</title></Head>
      <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>
          🎯 MY BETS
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {['all', 'pending', 'won', 'lost', 'settled'].map(f => (
            <button key={f} onClick={() => { setFilter(f); setLoading(true) }} style={{
              padding: '10px 18px', background: 'none', border: 'none',
              borderBottom: `3px solid ${filter === f ? 'var(--accent)' : 'transparent'}`,
              color: filter === f ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' as const,
            }}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Loading bets...</div>
        ) : bets.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              No bets found
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {filter === 'all' ? 'Place your first bet to see it here!' : `No ${filter} bets`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bets.map((bet: any, i: number) => (
              <div key={bet.id ?? i} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{bet.type ?? 'Single'} Bet</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                      #{bet.id?.slice(-8) ?? i}
                    </span>
                  </div>
                  <StatusBadge status={bet.status} />
                </div>

                {bet.selections?.map((sel: any, j: number) => (
                  <div key={j} style={{
                    background: 'var(--bg-elevated)', borderRadius: 4, padding: '8px 12px', marginBottom: 4,
                  }}>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sel.label ?? sel.outcomeName ?? 'Selection'}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      @ {sel.odds?.toFixed(2)}
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Stake: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      ₹{(bet.totalStake ?? bet.stake ?? 0).toLocaleString('en-IN')}
                    </span>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {bet.status === 'won' ? 'Won: ' : 'Potential: '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: bet.status === 'won' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      ₹{(bet.potentialWin ?? bet.payout ?? 0).toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>

                {bet.createdAt && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    {new Date(bet.createdAt).toLocaleString('en-IN')}
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

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? 'pending').toLowerCase()
  const colors: Record<string, { bg: string; text: string }> = {
    pending:  { bg: 'rgba(240,165,0,0.15)', text: 'var(--accent-2)' },
    won:      { bg: 'rgba(0,212,170,0.15)', text: 'var(--accent)' },
    lost:     { bg: 'rgba(224,63,63,0.15)', text: 'var(--live-red)' },
    settled:  { bg: 'rgba(139,149,162,0.15)', text: 'var(--text-secondary)' },
    void:     { bg: 'rgba(139,149,162,0.15)', text: 'var(--text-secondary)' },
  }
  const c = colors[s] ?? colors.pending
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 4,
      background: c.bg, color: c.text, textTransform: 'uppercase' as const,
    }}>{s}</span>
  )
}
