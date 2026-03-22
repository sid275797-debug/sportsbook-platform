'use client'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { walletApi, bettingApi } from '../lib/api'
import { useAuthStore } from '../store'

interface Transaction { id: string; type: string; amount: number; status: string; createdAt: string }
interface Bet { id: string; status: string; totalOdds: number; totalStake: number; potentialPayout: number; createdAt: string; selections: any[] }

export default function Dashboard() {
  const { user, balance, setBalance } = useAuthStore()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [bets, setBets] = useState<Bet[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'bets' | 'transactions'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    Promise.all([
      walletApi.balance().then(r => setBalance(r.data.data?.balance ?? 0)),
      walletApi.history().then(r => setTransactions(r.data.data ?? [])),
      bettingApi.myBets().then(r => setBets(r.data.data ?? [])),
    ]).finally(() => setLoading(false))
  }, [user])

  if (!user) return null

  const wonBets   = bets.filter(b => b.status === 'WON').length
  const lostBets  = bets.filter(b => b.status === 'LOST').length
  const pendBets  = bets.filter(b => b.status === 'PENDING').length
  const totalStaked = bets.reduce((s, b) => s + b.totalStake, 0)

  return (
    <Layout>
      <Head><title>My Account — BetPro</title></Head>
      <div style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Profile header */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
          display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#000',
            flexShrink: 0,
          }}>{user.username?.[0]?.toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{user.username}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>{user.email}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 4, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                VERIFIED
              </span>
              <span style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                {user.role ?? 'MEMBER'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Balance</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 28, color: 'var(--accent)' }}>
              ₹{balance.toLocaleString('en-IN')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Link href="/wallet/deposit" style={{
                background: 'var(--accent)', color: '#000', padding: '8px 16px',
                borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 12,
              }}>+ DEPOSIT</Link>
              <Link href="/wallet/withdraw" style={{
                background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', padding: '8px 16px',
                borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 12,
              }}>WITHDRAW</Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Bets', value: bets.length, color: 'var(--text-primary)', icon: '🎯' },
            { label: 'Won', value: wonBets, color: '#22c55e', icon: '✅' },
            { label: 'Lost', value: lostBets, color: 'var(--live-red)', icon: '❌' },
            { label: 'Total Staked', value: `₹${totalStaked.toLocaleString('en-IN')}`, color: 'var(--accent-2)', icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {(['overview', 'bets', 'transactions'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: activeTab === t ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === t ? 'var(--accent)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              letterSpacing: 0.4, cursor: 'pointer', textTransform: 'uppercase',
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>QUICK ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '🏏 Bet on Cricket', href: '/sportsbook?sport=cricket' },
                  { label: '🚀 Play Crash', href: '/casino/crash' },
                  { label: '💰 Deposit Funds', href: '/wallet/deposit' },
                  { label: '🎁 View Promotions', href: '/promotions' },
                ].map(a => (
                  <Link key={a.href} href={a.href} style={{
                    padding: '10px 14px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>{a.label}</Link>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>RECENT BETS</div>
              {bets.slice(0, 5).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleDateString()}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{b.totalStake}</span>
                  <StatusBadge status={b.status} />
                </div>
              ))}
              {bets.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No bets yet</div>}
            </div>
          </div>
        )}

        {activeTab === 'bets' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
                <div>No bets placed yet</div>
                <Link href="/sportsbook" style={{ color: 'var(--accent)', display: 'block', marginTop: 12 }}>Start betting →</Link>
              </div>
            ) : bets.map(b => (
              <div key={b.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{new Date(b.createdAt).toLocaleString()}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{b.selections?.length ?? 0} selection{(b.selections?.length ?? 0) !== 1 ? 's' : ''}</div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stake</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{b.totalStake}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Odds</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)' }}>{b.totalOdds?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Return</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{b.potentialPayout?.toFixed(0)}</div>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
                <div>No transactions yet</div>
                <Link href="/wallet/deposit" style={{ color: 'var(--accent)', display: 'block', marginTop: 12 }}>Make a deposit →</Link>
              </div>
            ) : transactions.map(t => (
              <div key={t.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{t.type === 'DEPOSIT' ? '⬇️' : t.type === 'WITHDRAWAL' ? '⬆️' : '🎯'}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: t.type === 'DEPOSIT' ? 'var(--accent)' : 'var(--live-red)' }}>
                    {t.type === 'DEPOSIT' ? '+' : '-'}₹{t.amount}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
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
    WON:       { bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
    LOST:      { bg: 'rgba(224,63,63,0.1)', color: '#e03f3f' },
    PENDING:   { bg: 'rgba(240,165,0,0.1)', color: '#f0a500' },
    SETTLED:   { bg: 'rgba(0,212,170,0.1)', color: '#00d4aa' },
    COMPLETED: { bg: 'rgba(0,212,170,0.1)', color: '#00d4aa' },
    FAILED:    { bg: 'rgba(224,63,63,0.1)', color: '#e03f3f' },
  }
  const s = map[status] ?? { bg: 'var(--bg-elevated)', color: 'var(--text-muted)' }
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}40`, borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 0.6 }}>
      {status}
    </span>
  )
}
