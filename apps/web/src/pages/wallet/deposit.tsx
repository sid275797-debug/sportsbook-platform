'use client'
import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { walletApi } from '../../lib/api'
import { useAuthStore } from '../../store'

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000, 25000]

const PAYMENT_METHODS = [
  { id: 'upi',         label: 'UPI',          emoji: '🔵', desc: 'PhonePe, GPay, Paytm UPI', instant: true },
  { id: 'phonepe',     label: 'PhonePe',      emoji: '💜', desc: 'Direct PhonePe wallet', instant: true },
  { id: 'gpay',        label: 'Google Pay',   emoji: '🔵', desc: 'Pay via Google Pay', instant: true },
  { id: 'paytm',       label: 'Paytm',        emoji: '💙', desc: 'Paytm wallet / UPI', instant: true },
  { id: 'netbanking',  label: 'Net Banking',  emoji: '🏦', desc: 'All major Indian banks', instant: false },
  { id: 'usdt',        label: 'USDT / Crypto',emoji: '₿',  desc: 'TRC20, ERC20, BEP20', instant: true },
]

export default function Deposit() {
  const { balance, setBalance } = useAuthStore()
  const [amount, setAmount]   = useState('')
  const [method, setMethod]   = useState('upi')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  async function handleDeposit() {
    const amt = parseFloat(amount)
    if (!amt || amt < 100) { setError('Minimum deposit is ₹100'); return }
    setLoading(true); setError('')
    try {
      const { data } = await walletApi.deposit({ amount: amt, provider: method })
      // After deposit initiate, backend returns a payment URL — in dev we simulate success
      // In production this would redirect to the payment provider
      setBalance(balance + amt)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Deposit failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <Layout>
      <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 8 }}>Deposit Successful!</div>
        <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>₹{amount} has been added to your account</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--accent)', marginBottom: 24 }}>
          New balance: ₹{balance.toLocaleString('en-IN')}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href="/sportsbook" style={{ background: 'var(--accent)', color: '#000', padding: '12px 24px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            BET NOW
          </Link>
          <button onClick={() => { setSuccess(false); setAmount('') }} style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '12px 24px', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
            Deposit More
          </button>
        </div>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <Head><title>Deposit — BetPro</title></Head>
      <div style={{ maxWidth: 600, margin: '32px auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>DEPOSIT FUNDS</div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '8px 16px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Balance: </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>₹{balance.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Bonus banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(240,165,0,0.12), rgba(0,212,170,0.08))',
          border: '1px solid rgba(240,165,0,0.25)', borderRadius: 'var(--radius-lg)',
          padding: '14px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 28 }}>🎁</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-2)', fontSize: 14 }}>100% Welcome Bonus — First Deposit Only!</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Deposit ₹1,000 → Get ₹2,000 to play with. Max bonus ₹10,000.</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>

          {/* Amount */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Amount (₹)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: 'var(--text-muted)' }}>₹</span>
              <input
                type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Enter amount"
                style={{
                  width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                  borderRadius: 'var(--radius)', padding: '14px 14px 14px 36px',
                  color: 'var(--text-primary)', fontSize: 20, fontFamily: 'var(--font-mono)',
                }}
              />
            </div>
            {/* Quick amounts */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))} style={{
                  padding: '6px 14px', background: amount === String(a) ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: amount === String(a) ? '#000' : 'var(--text-secondary)',
                  border: `1px solid ${amount === String(a) ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>₹{a >= 1000 ? `${a/1000}K` : a}</button>
              ))}
            </div>
            {amount && parseFloat(amount) >= 100 && (
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--accent)' }}>
                🎁 You'll receive ₹{(parseFloat(amount) * 2).toLocaleString('en-IN')} (incl. 100% bonus)
              </div>
            )}
          </div>

          {/* Payment method */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Payment Method
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: method === m.id ? 'rgba(0,212,170,0.08)' : 'var(--bg-elevated)',
                  border: `1px solid ${method === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{m.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.desc}</div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {m.instant && <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700 }}>⚡ INSTANT</span>}
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${method === m.id ? 'var(--accent)' : 'var(--border)'}`,
                    background: method === m.id ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {method === m.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#000' }} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.4)', borderRadius: 6, padding: '10px 14px', color: 'var(--live-red)', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={handleDeposit} disabled={loading || !amount} style={{
            width: '100%', padding: '14px',
            background: !amount ? 'var(--bg-elevated)' : 'var(--accent)',
            color: !amount ? 'var(--text-muted)' : '#000',
            borderRadius: 'var(--radius)', border: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, letterSpacing: 0.5,
            cursor: amount ? 'pointer' : 'not-allowed',
          }}>
            {loading ? 'PROCESSING...' : `DEPOSIT ₹${amount || '0'}`}
          </button>

          <div style={{ marginTop: 12, textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
            🔒 Secured by 256-bit SSL encryption. Min ₹100 / Max ₹5,00,000
          </div>
        </div>
      </div>
    </Layout>
  )
}
