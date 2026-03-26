import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'

export default function Custom404() {
  return (
    <Layout hideSidebar>
      <Head><title>404 — BetPro</title></Head>
      <div style={{
        minHeight: 'calc(100vh - var(--nav-height) - 200px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px', textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 120,
          color: 'var(--accent)', lineHeight: 1, opacity: 0.3,
        }}>404</div>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28,
          marginTop: -20, marginBottom: 12,
        }}>Page Not Found</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, marginBottom: 32 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back to the action.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/" style={{
            background: 'var(--accent)', color: '#000', padding: '12px 24px',
            borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)',
            fontWeight: 700, fontSize: 14, letterSpacing: 0.5,
          }}>GO HOME</Link>
          <Link href="/sportsbook" style={{
            background: 'var(--bg-card)', color: 'var(--text-secondary)',
            padding: '12px 24px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
          }}>SPORTSBOOK</Link>
        </div>
      </div>
    </Layout>
  )
}
