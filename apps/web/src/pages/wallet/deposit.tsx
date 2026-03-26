import { useState, FormEvent } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import { walletApi } from '../../lib/api'

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
]

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000]

export default function DepositPage() {
  const router = useRouter()
  const { user, setBalance } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('upi')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!user) { if (typeof window !== 'undefined') router.push('/login'); return null }

  async function handleDeposit(e: FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 100) { setMessage({ type: 'error', text: 'Minimum deposit is ₹100' }); return }
    setLoading(true); setMessage(null)
    try {
      await walletApi.deposit({ amount: amt, method })
      setMessage({ type: 'success', text: `₹${amt.toLocaleString('en-IN')} deposited successfully!` })
      setAmount('')
      // Refresh balance
      try {
        const bal = await walletApi.balance()
        setBalance(bal.data.data?.available ?? bal.data.available ?? 0)
      } catch {}
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error ?? 'Deposit failed' })
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <Head><title>Deposit — BetPro</title></Head>
      <div style={{ padding: '24px', maxWidth: 520, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 24 }}>
          💰 DEPOSIT FUNDS
        </div>

        {message && (
          <div style={{
            padding: '12px 16px', borderRadius: 'var(--radius)', marginBottom: 16,
            background: message.type === 'success' ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)',
            color: message.type === 'success' ? 'var(--accent)' : 'var(--live-red)',
            border: `1px solid ${message.type === 'success' ? 'var(--accent-dim)' : 'var(--live-red)'}`,
            fontSize: 13,
          }}>{message.text}</div>
        )}

        <form onSubmit={handleDeposit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Amount */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, marginBottom: 8 }}>
              Amount (₹)
            </label>
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount" min="100"
              style={{
                width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                borderRadius: 'var(--radius)', padding: '12px 14px', color: 'var(--text-primary)',
                fontSize: 18, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} type="button" onClick={() => setAmount(String(a))} style={{
                  background: amount === String(a) ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: amount === String(a) ? '#000' : 'var(--text-secondary)',
                  border: '1px solid var(--border)', borderRadius: 4,
                  padding: '6px 14px', fontSize: 12, fontWeight: 600,
                }}>₹{a.toLocaleString('en-IN')}</button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-secondary)', textTransform: 'uppercase' as const, marginBottom: 8 }}>
              Payment Method
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} type="button" onClick={() => setMethod(pm.id)} style={{
                  background: method === pm.id ? 'var(--accent-glow)' : 'var(--bg-card)',
                  border: `1px solid ${method === pm.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: '14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 14, fontWeight: 600,
                  color: method === pm.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  <span style={{ fontSize: 20 }}>{pm.icon}</span>
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            padding: '14px',
            background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : '#000',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: 0.5,
          }}>
            {loading ? 'Processing...' : 'DEPOSIT'}
          </button>
        </form>
      </div>
    </Layout>
  )
}
