import Head from 'next/head'
import Layout from '../components/Layout'

export default function TermsPage() {
  return (
    <Layout>
      <Head><title>Terms & Conditions — BetPro</title></Head>
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
          Terms & Conditions
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: March 2026</div>

        {[
          { title: '1. Acceptance of Terms', content: 'By accessing or using BetPro, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the platform.' },
          { title: '2. Eligibility', content: 'You must be at least 18 years of age to use BetPro. By using the platform, you represent that you meet this age requirement and are legally permitted to gamble in your jurisdiction.' },
          { title: '3. Account Registration', content: 'You must provide accurate information when registering. You are responsible for maintaining the confidentiality of your account credentials. One account per person.' },
          { title: '4. Deposits & Withdrawals', content: 'All deposits are processed via supported payment methods. Withdrawals are subject to verification and may require KYC documents for amounts exceeding ₹10,000.' },
          { title: '5. Betting Rules', content: 'All bets are subject to the rules of the specific sport or game. BetPro reserves the right to void bets in cases of obvious error, technical failure, or rule violations.' },
          { title: '6. Responsible Gambling', content: 'BetPro promotes responsible gambling. You may set deposit limits, loss limits, or self-exclude at any time by contacting support.' },
          { title: '7. Limitation of Liability', content: 'BetPro is not liable for any losses incurred through the use of the platform, including but not limited to betting losses, technical failures, or unauthorized account access.' },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              {s.content}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
