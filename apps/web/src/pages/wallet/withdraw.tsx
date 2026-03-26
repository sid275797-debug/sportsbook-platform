import { useState, FormEvent } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import { walletApi } from '../../lib/api'

export default function WithdrawPage() {
  const router = useRouter()
  const { user, balance, setBalance } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('upi')
  const [upiId, setUpiId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!user) { if (typeof window !== 'undefined') router.push('/login'); return null }

  async function handleWithdraw(e: FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt < 100) { setMessage({ type: 'error', text: 'Minimum withdrawal is ₹100' }); return }
    if (amt > balance) { setMessage({ type: 'error', text: 'Insufficient balance' }); return }
    setLoading(true); setMessage(null)
    try {
      await walletApi.withdraw({
        amount: amt,
        method,
        accountDetails: method === 'upi' ? { upiId } : undefined,
      })
      setMessage({ type: 'success', text: `Withdrawal of ₹${amt.toLocaleString('en-IN')} initiated!` })
      setAmount('')
      try {
        const bal = await walletApi.balance()
        setBalance(bal.data.data?.available ?? bal.data.available ?? 0)
      } catch {}
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error ?? 'Withdrawal failed' })
    } finally { setLoading(false) }
  }

  return (
    <Layout>
      <Head><title>Withdraw — BetPro</title></Head>
      <div style={{ padding: '24px', maxWidth: 520, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 8 }}>
          ⬆️ WITHDRAW FUNDS
        </div>

        {/* Balance display */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const }}>
            Available Balance
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--accent)' }}>
            ₹{balance?.toLocaleString('en-IN') ?? '0'}
          </span>
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

        <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={labelStyle}>Amount (₹)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount" min="100" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Withdrawal Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { id: 'upi', label: 'UPI', icon: '📱' },
                { id: 'bank', label: 'Bank Transfer', icon: '🏦' },
              ].map(pm => (
                <button key={pm.id} type="button" onClick={() => setMethod(pm.id)} style={{
                  background: method === pm.id ? 'var(--accent-glow)' : 'var(--bg-card)',
                  border: `1px solid ${method === pm.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', padding: '14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 14, fontWeight: 600,
                  color: method === pm.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  <span style={{ fontSize: 20 }}>{pm.icon}</span>{pm.label}
                </button>
              ))}
            </div>
          </div>

          {method === 'upi' && (
            <div>
              <label style={labelStyle}>UPI ID</label>
              <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)}
                placeholder="yourname@upi" style={inputStyle} />
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            padding: '14px',
            background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : '#000',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: 0.5,
          }}>
            {loading ? 'Processing...' : 'WITHDRAW'}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Withdrawals are processed within 1-24 hours. Minimum withdrawal: ₹100.
          KYC verification may be required for amounts above ₹10,000.
        </div>
      </div>
    </Layout>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
  color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8,
}
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
  borderRadius: 'var(--radius)', padding: '12px 14px', color: 'var(--text-primary)',
  fontSize: 16, fontFamily: 'var(--font-mono)', fontWeight: 600, outline: 'none',
}
