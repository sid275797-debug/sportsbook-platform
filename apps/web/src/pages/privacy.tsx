import Head from 'next/head'
import Layout from '../components/Layout'

export default function Privacy() {
  return (
    <Layout>
      <Head><title>Privacy Policy — BetPro</title></Head>
      <div style={{ maxWidth: 760, margin: '40px auto', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>Privacy Policy</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 32 }}>Last updated: January 2025</div>
        {[
          { title: 'Information We Collect', body: 'We collect information you provide during registration (name, email, phone), payment information processed through our secure payment partners, betting activity and transaction history, and device and usage data for security purposes.' },
          { title: 'How We Use Your Information', body: 'Your information is used to operate and maintain your account, process transactions, verify your identity for KYC compliance, send relevant promotional communications (opt-out available), and detect and prevent fraud.' },
          { title: 'Data Sharing', body: 'We do not sell your personal data. We share data only with KYC verification partners, payment processors, and regulatory authorities when legally required. All third parties are contractually bound to protect your data.' },
          { title: 'Data Security', body: 'All data is encrypted in transit using TLS 1.3. Passwords are hashed using bcrypt. We conduct regular security audits. In the event of a data breach, you will be notified within 72 hours.' },
          { title: 'Your Rights', body: 'You have the right to access your personal data, request corrections, request deletion of your account and data (subject to legal retention requirements), and opt out of marketing communications at any time.' },
          { title: 'Cookies', body: 'We use essential cookies for session management and security. Analytics cookies are used to improve the platform. You can manage cookie preferences in your browser settings.' },
          { title: 'Contact', body: 'For any privacy-related enquiries, contact our Data Protection Officer at privacy@betpro.com or write to our registered address.' },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, marginBottom: 8, color: 'var(--text-primary)' }}>{section.title}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{section.body}</div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
