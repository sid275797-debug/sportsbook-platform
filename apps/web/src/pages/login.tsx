'use client'
import { useState, FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { authApi, walletApi } from '../lib/api'
import { useAuthStore } from '../store'
import Layout from '../components/Layout'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { setAuth, setBalance } = useAuthStore()
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data } = await authApi.login({ email, password })
      const tokens = data.data ?? data
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
      const me = await authApi.me()
      const user = me.data.data ?? me.data
      setAuth(user, tokens.accessToken)
      try {
        const bal = await walletApi.balance()
        setBalance(bal.data.data?.available ?? bal.data.available ?? 0)
      } catch {}
      await router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <Layout hideSidebar>
      <Head><title>Log In — BetPro</title></Head>
      <div style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        display: 'flex',
        background: 'var(--bg-base)',
      }}>
        {/* Left promo panel */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0d1f12 0%, #071218 100%)',
          padding: '60px 48px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          borderRight: '1px solid var(--border)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 30% 60%, rgba(0,212,170,0.06) 0%, transparent 60%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000',
              }}>B</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: 0.5 }}>
                BET<span style={{ color: 'var(--accent)' }}>PRO</span>
              </span>
            </Link>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42,
              lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 16,
            }}>
              INDIA&apos;S <span style={{ color: 'var(--accent)' }}>BEST</span><br />
              BETTING<br />PLATFORM
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 380, marginBottom: 36 }}>
              Bet on cricket, football, and 20+ sports. Play live casino games with instant payouts.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '⚡', text: 'Instant deposits & withdrawals via UPI, Net Banking' },
                { icon: '🔐', text: 'Provably fair casino games with cryptographic RNG' },
                { icon: '🎁', text: '100% welcome bonus up to ₹10,000 for new members' },
                { icon: '🏏', text: 'Best odds on IPL, Big Bash, T20 World Cup' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div style={{
          width: 480, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '48px 48px', flexShrink: 0,
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>Welcome back</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Log in to access your account
            </div>
          </div>
          {error && (
            <div style={{
              background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.4)',
              borderRadius: 'var(--radius)', padding: '10px 14px',
              color: 'var(--live-red)', fontSize: 13, marginBottom: 16,
            }}>{error}</div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FieldLabel label="Email Address">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@example.com" style={inputStyle}
              />
            </FieldLabel>
            <FieldLabel label="Password">
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Your password" style={inputStyle}
              />
            </FieldLabel>
            <div style={{ textAlign: 'right' }}>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)' }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '13px',
              background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
              color: loading ? 'var(--text-muted)' : '#000',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
              transition: 'all 0.15s', marginTop: 4,
            }}>
              {loading ? 'Logging in...' : 'LOG IN'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register</Link>
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
  fontSize: 14, outline: 'none', transition: 'border-color 0.15s',
}
