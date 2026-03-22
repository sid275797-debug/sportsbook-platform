'use client'
import Head from 'next/head'
import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { authApi, walletApi } from '../lib/api'
import { useAuthStore } from '../store'

export default function Register() {
  const [step, setStep] = useState<1 | 2>(1)
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [referral, setReferral] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [agreed, setAgreed]     = useState(false)
  const { setAuth, setBalance } = useAuthStore()
  const router = useRouter()

  function pwStrength(p: string) {
    return [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length
  }
  const strength = pwStrength(password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', '#e03f3f', '#f0a500', '#22c55e', '#00d4aa'][strength]

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (!agreed) { setError('You must agree to the Terms & Conditions'); return }
    setLoading(true); setError('')
    try {
      await authApi.register({ username, email, password })
      // Auto login after register
      const { data } = await authApi.login({ email, password })
      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      const me = await authApi.me()
      setAuth(me.data.data, data.data.accessToken)
      try { const bal = await walletApi.balance(); setBalance(bal.data.data?.balance ?? 0) } catch {}
      await router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <>
      <Head><title>Join BetPro — Register</title></Head>
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
            <div style={{
              width: 36, height: 36,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000',
            }}>B</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>
              BET<span style={{ color: 'var(--accent)' }}>PRO</span>
            </span>
          </Link>

          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '32px',
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginBottom: 6 }}>
                Create Account
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log In</Link>
              </div>
            </div>

            {/* Welcome bonus banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(240,165,0,0.1))',
              border: '1px solid rgba(0,212,170,0.2)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <span style={{ fontSize: 24 }}>🎁</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>Welcome Bonus</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>100% deposit match up to ₹10,000 on first deposit</div>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.4)',
                borderRadius: 6, padding: '10px 14px', color: 'var(--live-red)',
                fontSize: 13, marginBottom: 16,
              }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Username">
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                    placeholder="Choose username" style={inp} />
                </Field>
                <Field label="Phone (optional)">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+91 XXXXXXXXXX" style={inp} />
                </Field>
              </div>

              <Field label="Email Address">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="you@example.com" style={inp} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Password">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="Min. 8 characters" style={inp} />
                </Field>
                <Field label="Confirm Password">
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                    placeholder="Repeat password" style={inp} />
                </Field>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[0,1,2,3].map(i => (
                      <div key={i} style={{
                        height: 3, flex: 1, borderRadius: 2,
                        background: i < strength ? strengthColor : 'var(--border)',
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strengthColor }}>{strengthLabel} password</div>
                </div>
              )}

              <Field label="Referral Code (optional)">
                <input type="text" value={referral} onChange={e => setReferral(e.target.value)}
                  placeholder="Enter promo/referral code" style={inp} />
              </Field>

              {/* Currency */}
              <Field label="Currency">
                <select style={{ ...inp, appearance: 'none' }}>
                  <option>Indian Rupee (INR ₹)</option>
                  <option>US Dollar (USD $)</option>
                  <option>Euro (EUR €)</option>
                </select>
              </Field>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  I am 18+ years old and agree to the{' '}
                  <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms & Conditions</Link>{' '}
                  and <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>.
                  I confirm I am not a resident of a restricted country.
                </span>
              </label>

              <button type="submit" disabled={loading || !agreed} style={{
                padding: '13px',
                background: (!agreed || loading) ? 'var(--bg-elevated)' : 'var(--accent)',
                color: (!agreed || loading) ? 'var(--text-muted)' : '#000',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
                border: 'none', cursor: agreed ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}>
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>OR SIGN UP WITH</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['🔵 Google', '✈️ Telegram'].map(b => (
                <button key={b} style={{
                  flex: 1, padding: '10px', background: 'var(--bg-card)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>{b}</button>
              ))}
            </div>
          </div>

          {/* Payment methods */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>ACCEPTED PAYMENT METHODS</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['UPI', 'PhonePe', 'GPay', 'Paytm', 'Net Banking', 'USDT'].map(m => (
                <span key={m} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '4px 10px', fontSize: 11, color: 'var(--text-secondary)',
                }}>{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        letterSpacing: 0.8, color: 'var(--text-secondary)',
        textTransform: 'uppercase', marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)',
  border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)',
  padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
}
