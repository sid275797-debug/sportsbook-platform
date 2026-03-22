import Head from 'next/head'
import Layout from '../components/Layout'

export default function Terms() {
  return (
    <Layout>
      <Head><title>Terms & Conditions — BetPro</title></Head>
      <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Terms &amp; Conditions</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: January 2025</div>
        {[
          { title: '1. Eligibility', body: 'You must be 18 years of age or older to register and use BetPro. By creating an account you confirm you meet the minimum age requirement and that online betting is legal in your jurisdiction.' },
          { title: '2. Account Responsibility', body: 'You are solely responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility. Notify us immediately of any unauthorised access.' },
          { title: '3. Deposits & Withdrawals', body: 'Funds deposited are used solely for wagering purposes. Withdrawals are processed within the timeframes stated on the withdrawal page. BetPro reserves the right to request identity verification before processing withdrawals.' },
          { title: '4. Bonus Terms', body: 'All bonuses are subject to a wagering requirement of at least 5× the bonus amount unless stated otherwise. Bonuses may not be withdrawn until wagering requirements are met. BetPro reserves the right to modify or cancel bonuses at any time.' },
          { title: '5. Responsible Gambling', body: 'BetPro is committed to responsible gambling. Self-exclusion, deposit limits, and cooling-off periods are available on request. If you feel you have a gambling problem, please contact us or seek help from a professional service.' },
          { title: '6. Prohibited Activities', body: 'Use of automated software, bots, or any method to gain unfair advantage is strictly prohibited. Collusion, money laundering, and fraud will result in immediate account suspension and forfeiture of funds.' },
          { title: '7. Limitation of Liability', body: 'BetPro is not liable for any losses arising from system downtime, errors, or third-party service failures. Maximum liability is limited to the amount deposited in the current session.' },
          { title: '8. Governing Law', body: 'These terms are governed by the laws of the jurisdiction in which BetPro is licensed. Any disputes will be resolved through the appropriate legal channels in that jurisdiction.' },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 8, color: 'var(--text-primary)' }}>{section.title}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{section.body}</div>
          </div>
        ))}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
          For questions about these terms, contact us at <span style={{ color: 'var(--accent)' }}>support@betpro.com</span>
        </div>
      </div>
    </Layout>
  )
}
