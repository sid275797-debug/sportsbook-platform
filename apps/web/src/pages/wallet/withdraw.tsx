'use client'
import { useState } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { walletApi } from '../../lib/api'
import { useAuthStore } from '../../store'
export default function Withdraw() {
  const { balance, setBalance } = useAuthStore()
  const [amount, setAmount]   = useState('')
  const [method, setMethod]   = useState('upi')
  const [account, setAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  async function handleWithdraw() {
    const amt = parseFloat(amount)
    if (!amt || amt < 500)   { setError('Minimum withdrawal is ₹500'); return }
    if (amt > balance)       { setError('Insufficient balance'); return }
    if (!account.trim())     { setError('Please enter your account details'); return }
    setLoading(true); setError('')
    try {
      await walletApi.withdraw({ amount: amt, bankAccount: account })
      setBalance(balance - amt)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Withdrawal request failed')
    } finally { setLoading(false) }
  }

  if (success) return (
    <Layout>
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Withdrawal Requested!</div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          ₹{amount} withdrawal is being processed. Funds arrive within 30 minutes via {method.toUpperCase()}.
        </div>
        <button onClick={() => { setSuccess(false); setAmount('') }} style={{ background: 'var(--accent)', color: '#000', padding: '12px 24px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer' }}>
          DONE
        </button>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <Head><title>Withdraw — BetPro</title></Head>
      <div style={{ maxWidth: 560, margin: '32px auto', padding: '0 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 24 }}>WITHDRAW FUNDS</div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          {/* Balance */}
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Available Balance</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', fontSize: 16 }}>₹{balance.toLocaleString('en-IN')}</span>
          </div>

          {/* Method */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Withdrawal Method</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['upi', 'bank', 'usdt'].map(m => (
                <button key={m} onClick={() => setMethod(m)} style={{
                  flex: 1, padding: '10px', background: method === m ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                  border: `1px solid ${method === m ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', color: method === m ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase',
                }}>{m === 'usdt' ? '₿ Crypto' : m === 'upi' ? '🔵 UPI' : '🏦 Bank'}</button>
              ))}
            </div>
          </div>

          {/* Account details */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {method === 'upi' ? 'UPI ID' : method === 'usdt' ? 'Wallet Address' : 'Bank Account / IFSC'}
            </label>
            <input
              type="text" value={account} onChange={e => setAccount(e.target.value)}
              placeholder={method === 'upi' ? 'yourname@upi' : method === 'usdt' ? '0x...' : 'Account No • IFSC'}
              style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }}
            />
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Amount (₹)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--text-muted)' }}>₹</span>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Min ₹500"
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: '12px 14px 12px 34px', color: 'var(--text-primary)', fontSize: 18, fontFamily: 'var(--font-mono)' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[500, 1000, 5000, 10000].map(a => (
                <button key={a} onClick={() => setAmount(String(Math.min(a, balance)))} style={{ padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  ₹{a >= 1000 ? `${a/1000}K` : a}
                </button>
              ))}
              <button onClick={() => setAmount(String(balance))} style={{ padding: '5px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>MAX</button>
            </div>
          </div>

          {error && <div style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.4)', borderRadius: 6, padding: '10px 14px', color: 'var(--live-red)', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <button onClick={handleWithdraw} disabled={loading || !amount || !account} style={{
            width: '100%', padding: '13px', background: (!amount || !account) ? 'var(--bg-elevated)' : 'var(--accent)',
            color: (!amount || !account) ? 'var(--text-muted)' : '#000',
            borderRadius: 'var(--radius)', border: 'none', fontFamily: 'var(--font-display)',
            fontWeight: 800, fontSize: 15, letterSpacing: 0.5, cursor: 'pointer',
          }}>
            {loading ? 'PROCESSING...' : `WITHDRAW ₹${amount || '0'}`}
          </button>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            ⚡ Processing time: UPI/Crypto: 30 min • Bank: 1-4 hours • KYC required for amounts above ₹10,000
          </div>
        </div>
      </div>
    </Layout>
  )
}
