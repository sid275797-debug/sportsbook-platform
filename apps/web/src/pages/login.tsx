import Head from 'next/head'
import Link from 'next/link'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { authApi, walletApi } from '../lib/api'
import { useAuthStore } from '../store'
import Layout from '../components/Layout'

type Tab = 'login' | 'register'

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>('login')

  return (
    <Layout hideSidebar>
      <Head><title>{tab === 'login' ? 'Log In' : 'Join BetPro'} — BetPro</title></Head>
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
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          borderRight: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 30% 60%, rgba(0,212,170,0.06) 0%, transparent 60%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 48,
            }}>
              <div style={{
                width: 36, height: 36,
                background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000',
              }}>B</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, letterSpacing: 0.5 }}>
                BET<span style={{ color: 'var(--accent)' }}>PRO</span>
              </span>
            </Link>

            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 42,
              lineHeight: 1.1,
              color: 'var(--text-primary)',
              marginBottom: 16,
            }}>
              INDIA'S <span style={{ color: 'var(--accent)' }}>BEST</span><br />
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
          width: 480,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 48px',
          flexShrink: 0,
        }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 4,
            marginBottom: 28,
          }}>
            {(['login', 'register'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 4,
                  background: tab === t ? 'var(--accent)' : 'transparent',
                  color: tab === t ? '#000' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: 0.6,
                  transition: 'all 0.15s',
                  textTransform: 'uppercase',
                }}
              >
                {t === 'login' ? 'Log In' : 'Register'}
              </button>
            ))}
          </div>

          {tab === 'login' ? <LoginForm /> : <RegisterForm onSuccess={() => setTab('login')} />}
        </div>
      </div>
    </Layout>
  )
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm() {
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
      localStorage.setItem('accessToken', data.data.accessToken)
      localStorage.setItem('refreshToken', data.data.refreshToken)
      const me = await authApi.me()
      setAuth(me.data.data, data.data.accessToken)
      try {
        const bal = await walletApi.balance()
        setBalance(bal.data.data?.available ?? 0)
      } catch {}
      await router.push('/')
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>Welcome back</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Log in to access your account
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(224,63,63,0.1)',
          border: '1px solid rgba(224,63,63,0.4)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          color: 'var(--live-red)',
          fontSize: 13,
          marginBottom: 16,
        }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Email Address">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="you@example.com"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Password">
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)} required
            placeholder="Your password"
            style={inputStyle}
          />
        </FormField>

        <div style={{ textAlign: 'right' }}>
          <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--accent)' }}>
            Forgot password?
          </Link>
        </div>

        <button
          type="submit" disabled={loading}
          style={{
            padding: '13px',
            background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
            color: loading ? 'var(--text-muted)' : '#000',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
            transition: 'all 0.15s',
            marginTop: 4,
          }}
        >{loading ? 'Logging in...' : 'LOG IN'}</button>
      </form>

      <Divider />
      <SocialButtons />
    </div>
  )
}

// ─── Register Form ────────────────────────────────────────────────────────────

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [agreed, setAgreed]     = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (!agreed) { setError('You must agree to the Terms & Conditions'); return }
    setLoading(true); setError('')
    try {
      await authApi.register({ username, email, password })
      onSuccess()
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>Create account</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Join thousands of bettors on BetPro
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(224,63,63,0.1)',
          border: '1px solid rgba(224,63,63,0.4)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          color: 'var(--live-red)',
          fontSize: 13,
          marginBottom: 16,
        }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FormField label="Username">
          <input
            type="text" value={username} onChange={e => setUsername(e.target.value)} required
            placeholder="Choose a username"
            style={inputStyle}
          />
        </FormField>
        <FormField label="Email Address">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)} required
            placeholder="you@example.com"
            style={inputStyle}
          />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Password">
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Min. 8 characters"
              style={inputStyle}
            />
          </FormField>
          <FormField label="Confirm Password">
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              placeholder="Repeat password"
              style={inputStyle}
            />
          </FormField>
        </div>

        {/* Password strength */}
        {password.length > 0 && (
          <PasswordStrength password={password} />
        )}

        {/* Terms */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            I am 18+ years old and agree to the{' '}
            <Link href="/terms" style={{ color: 'var(--accent)' }}>Terms & Conditions</Link>{' '}
            and{' '}
            <Link href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
          </span>
        </label>

        <button
          type="submit" disabled={loading || !agreed}
          style={{
            padding: '13px',
            background: (!agreed || loading) ? 'var(--bg-elevated)' : 'var(--accent)',
            color: (!agreed || loading) ? 'var(--text-muted)' : '#000',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
            transition: 'all 0.15s',
            marginTop: 4,
          }}
        >{loading ? 'Creating account...' : 'CREATE ACCOUNT'}</button>
      </form>

      <Divider />
      <SocialButtons />
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.8,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>{label}</label>
      {children}
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length

  const labels  = ['Weak', 'Fair', 'Good', 'Strong']
  const colors  = ['var(--live-red)', 'var(--accent-2)', '#22c55e', 'var(--accent)']

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: 3, flex: 1, borderRadius: 2,
            background: i < score ? colors[score - 1] : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {score > 0 && (
        <div style={{ fontSize: 11, color: colors[score - 1] }}>
          {labels[score - 1]} password
        </div>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>OR CONTINUE WITH</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function SocialButtons() {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {[
        { name: 'Google', emoji: '🔵' },
        { name: 'Telegram', emoji: '✈️' },
      ].map(({ name, emoji }) => (
        <button
          key={name}
          style={{
            flex: 1,
            padding: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer',
          }}
        >{emoji} {name}</button>
      ))}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-bright)',
  borderRadius: 'var(--radius)',
  padding: '10px 14px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s',
}
