import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'

export default function NotFound() {
  return (
    <Layout hideSidebar>
      <Head><title>404 — Page Not Found — BetPro</title></Head>
      <div style={{ minHeight: 'calc(100vh - var(--nav-height))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 480 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 96, color: 'var(--accent)', lineHeight: 1, marginBottom: 8 }}>404</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 12 }}>Page Not Found</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
            The page you're looking for doesn't exist or has been moved.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ background: 'var(--accent)', color: '#000', padding: '11px 24px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
              🏠 HOME
            </Link>
            <Link href="/sportsbook" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '11px 24px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
              ⚽ SPORTSBOOK
            </Link>
            <Link href="/casino" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '11px 24px', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
              🎰 CASINO
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
