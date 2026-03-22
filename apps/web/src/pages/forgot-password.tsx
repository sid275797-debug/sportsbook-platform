'use client'
import { useState, FormEvent } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import api from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/api/auth/send-otp', { phone: email })
      setSent(true)
    } catch {
      // show success regardless to prevent user enumeration
      setSent(true)
    } finally { setLoading(false) }
  }

  return (
    <Layout hideSidebar>
      <Head><title>Forgot Password — BetPro</title></Head>
      <div style={{
        minHeight: 'calc(100vh - var(--nav-height))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px', background: 'var(--bg-base)',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000' }}>B</div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>BET<span style={{ color: 'var(--accent)' }}>PRO</span></span>
          </Link>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 32 }}>
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Check your email</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                  If an account exists for <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>, we've sent password reset instructions.
                </div>
                <Link href="/login" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>← Back to login</Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, marginBottom: 6 }}>Reset your password</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Enter your email and we'll send reset instructions.</div>
                </div>

                {error && (
                  <div style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.4)', borderRadius: 6, padding: '10px 14px', color: 'var(--live-red)', fontSize: 13, marginBottom: 16 }}>{error}</div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                      style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14 }} />
                  </div>
                  <button type="submit" disabled={loading} style={{
                    padding: '13px', background: loading ? 'var(--bg-elevated)' : 'var(--accent)',
                    color: loading ? 'var(--text-muted)' : '#000', borderRadius: 'var(--radius)', border: 'none',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, letterSpacing: 0.5, cursor: 'pointer',
                  }}>
                    {loading ? 'SENDING...' : 'SEND RESET LINK'}
                  </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <Link href="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Back to login</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
