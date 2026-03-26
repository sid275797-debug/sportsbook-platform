import Head from 'next/head'
import Layout from '../../components/Layout'

export default function TeenPattiPage() {
  return (
    <Layout>
      <Head><title>Teen Patti — BetPro Casino</title></Head>
      <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>
          🎴 Teen Patti
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '60px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎴</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, marginBottom: 12 }}>
            Teen Patti
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
            Game interface coming soon. Backend is ready at /api/casino/teen-patti.
          </div>
          <div style={{
            display: 'inline-block', background: 'var(--accent-glow)', border: '1px solid var(--accent-dim)',
            borderRadius: 'var(--radius)', padding: '12px 24px',
            color: 'var(--accent)', fontWeight: 700, fontSize: 13,
          }}>COMING SOON</div>
        </div>
      </div>
    </Layout>
  )
}
