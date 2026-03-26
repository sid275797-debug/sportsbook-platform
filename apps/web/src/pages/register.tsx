'use client'
import { useState, FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { authApi } from '../lib/api'
import Layout from '../components/Layout'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [agreed, setAgreed]     = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (!agreed) { setError('You must agree to the Terms & Conditions'); return }
    setLoading(true); setError('')
    try {
      await authApi.register({ username, email, password })
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed')
    } finally { setLoading(false) }
  }

  const passwordScore = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['var(--live-red)', 'var(--accent-2)', '#22c55e', 'var(--accent)']

  return (
    <Layout hideSidebar>
      <Head><title>Join BetPro</title></Head>
      <div style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'var(--bg-base)', padding: '40px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>
              Create your <span style={{ color: 'var(--accent)' }}>BetPro</span> account
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
              Join thousands of bettors on India&apos;s best platform
            </div>
          </div>

          {success && (
            <div style={{
              background: 'rgba(0,212,170,0.1)', border: '1px solid var(--accent-dim)',
              borderRadius: 'var(--radius)', padding: '14px', color: 'var(--accent)',
              fontSize: 13, marginBottom: 16, textAlign: 'center',
            }}>Account created! Redirecting to login...</div>
          )}

          {error && (
            <div style={{
              background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.4)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
              color: 'var(--live-red)', fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldLabel label="Username">
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                placeholder="Choose a username" style={inputStyle} />
            </FieldLabel>
            <FieldLabel label="Email Address">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com" style={inputStyle} />
            </FieldLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FieldLabel label="Password">
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="Min. 8 characters" style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Confirm Password">
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Repeat password" style={inputStyle} />
              </FieldLabel>
            </div>

            {password.length > 0 && (
              <div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} style={{
                      height: 3, flex: 1, borderRadius: 2,
                      background: i < passwordScore ? strengthColors[passwordScore - 1] : 'var(--border)',
                      transition: 'background 0.3s',
                    }} />
                  ))}
                </div>
                {passwordScore > 0 && (
                  <div style={{ fontSize: 11, color: strengthColors[passwordScore - 1] }}>
                    {strengthLabels[passwordScore - 1]} password
                  </div>
                )}
              </div>
            )}

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                style={{ marginTop: 2, accentColor: 'var(--accent)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                I am 18+ years old and agree to the{' '}
                <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms & Conditions</Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
              </span>
            </label>

            <button type="submit" disabled={loading || !agreed} style={{
              padding: '13px',
              background: (!agreed || loading) ? 'var(--bg-elevated)' : 'var(--accent)',
              color: (!agreed || loading) ? 'var(--text-muted)' : '#000',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
              transition: 'all 0.15s', marginTop: 4,
            }}>
              {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Log In</Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
        color: 'var(--text-secondary)', textTransform: 'uppercase' as const, marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
  borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text-primary)',
  fontSize: 14, outline: 'none',
}
