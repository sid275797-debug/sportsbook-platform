import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import { walletApi, bettingApi } from '../lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { user, balance, setBalance } = useAuthStore()
  const [recentBets, setRecentBets] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }

    async function load() {
      try {
        const [balRes, betsRes, txRes] = await Promise.allSettled([
          walletApi.balance(),
          bettingApi.myBets({ limit: 5 }),
          walletApi.transactions({ limit: 5 }),
        ])
        if (balRes.status === 'fulfilled') {
          setBalance(balRes.value.data.data?.available ?? balRes.value.data.available ?? 0)
        }
        if (betsRes.status === 'fulfilled') {
          const d = betsRes.value.data?.data ?? betsRes.value.data ?? []
          setRecentBets(Array.isArray(d) ? d : [])
        }
        if (txRes.status === 'fulfilled') {
          const d = txRes.value.data?.data ?? txRes.value.data ?? []
          setTransactions(Array.isArray(d) ? d : [])
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [user, router, setBalance])

  if (!user) return null

  return (
    <Layout>
      <Head><title>Dashboard — BetPro</title></Head>
      <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 24 }}>
          Welcome back, <span style={{ color: 'var(--accent)' }}>{user.username}</span>
        </div>

        {/* Balance cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
          <DashCard label="Available Balance" value={`₹${balance?.toLocaleString('en-IN') ?? '0'}`} accent />
          <DashCard label="Email" value={user.email} />
          <DashCard label="Account Type" value={user.role?.toUpperCase() ?? 'USER'} />
          <DashCard label="Quick Actions" value="">
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <Link href="/wallet/deposit" style={{
                background: 'var(--accent)', color: '#000', padding: '6px 12px',
                borderRadius: 4, fontSize: 11, fontWeight: 700,
              }}>DEPOSIT</Link>
              <Link href="/wallet/withdraw" style={{
                background: 'var(--bg-elevated)', color: 'var(--text-secondary)', padding: '6px 12px',
                borderRadius: 4, fontSize: 11, fontWeight: 700, border: '1px solid var(--border)',
              }}>WITHDRAW</Link>
            </div>
          </DashCard>
        </div>

        {/* Recent Bets */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>RECENT BETS</span>
            <Link href="/bets" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>View all →</Link>
          </div>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Loading...</div>
          ) : recentBets.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 13,
            }}>No bets placed yet. Start betting!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentBets.map((bet: any, i: number) => (
                <div key={bet.id ?? i} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{bet.type ?? 'Single'} Bet</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Stake: ₹{bet.totalStake?.toLocaleString('en-IN') ?? bet.stake ?? '0'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: bet.status === 'won' ? 'rgba(0,212,170,0.15)' : bet.status === 'lost' ? 'rgba(224,63,63,0.15)' : 'rgba(240,165,0,0.15)',
                    color: bet.status === 'won' ? 'var(--accent)' : bet.status === 'lost' ? 'var(--live-red)' : 'var(--accent-2)',
                  }}>{(bet.status ?? 'pending').toUpperCase()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>RECENT TRANSACTIONS</span>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', padding: '20px 0' }}>Loading...</div>
          ) : transactions.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '24px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: 13, marginTop: 12,
            }}>No transactions yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
              {transactions.map((tx: any, i: number) => (
                <div key={tx.id ?? i} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.type ?? 'Transaction'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN') : ''}
                    </div>
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                    color: (tx.type === 'credit' || tx.type === 'deposit') ? 'var(--accent)' : 'var(--live-red)',
                  }}>
                    {(tx.type === 'credit' || tx.type === 'deposit') ? '+' : '-'}₹{Math.abs(tx.amount)?.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

function DashCard({ label, value, accent, children }: { label: string; value: string; accent?: boolean; children?: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '16px 20px',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase' as const, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        fontFamily: accent ? 'var(--font-mono)' : 'var(--font-body)',
        fontWeight: 700, fontSize: accent ? 24 : 14,
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
      }}>{value}</div>
      {children}
    </div>
  )
}
