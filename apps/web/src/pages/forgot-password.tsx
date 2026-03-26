import { useState, FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { authApi } from '../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await authApi.forgotPassword({ email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to send reset email')
    } finally { setLoading(false) }
  }

  return (
    <Layout hideSidebar>
      <Head><title>Forgot Password — BetPro</title></Head>
      <div style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        background: 'var(--bg-base)', padding: '40px 20px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>Reset Password</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
              Enter your email and we&apos;ll send you a reset link
            </div>
          </div>

          {sent ? (
            <div style={{
              background: 'rgba(0,212,170,0.1)', border: '1px solid var(--accent-dim)',
              borderRadius: 'var(--radius)', padding: '20px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
              <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>Check your email</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                If an account exists for {email}, you&apos;ll receive a password reset link.
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.4)',
                  borderRadius: 'var(--radius)', padding: '10px 14px',
                  color: 'var(--live-red)', fontSize: 13, marginBottom: 16,
                }}>{error}</div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{
                    display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                    color: 'var(--text-secondary)', textTransform: 'uppercase' as const, marginBottom: 6,
                  }}>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@example.com"
                    style={{
                      width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                      borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text-primary)',
                      fontSize: 14, outline: 'none',
                    }} />
                </div>
                <button type="submit" disabled={loading} style={{
                  padding: '13px',
                  background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
                  color: loading ? 'var(--text-muted)' : '#000',
                  borderRadius: 'var(--radius)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: 0.5,
                }}>
                  {loading ? 'Sending...' : 'SEND RESET LINK'}
                </button>
              </form>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>← Back to Login</Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
