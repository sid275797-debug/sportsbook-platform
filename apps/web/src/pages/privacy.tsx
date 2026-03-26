import Head from 'next/head'
import Layout from '../components/Layout'

export default function PrivacyPage() {
  return (
    <Layout>
      <Head><title>Privacy Policy — BetPro</title></Head>
      <div style={{ padding: '32px 24px', maxWidth: 800, margin: '0 auto' }} className="fade-up">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 8 }}>
          Privacy Policy
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>Last updated: March 2026</div>

        {[
          { title: '1. Information We Collect', content: 'We collect personal information you provide during registration (name, email, phone), payment information for deposits/withdrawals, and usage data including betting history and device information.' },
          { title: '2. How We Use Your Information', content: 'Your data is used to provide and improve our services, process transactions, verify identity (KYC), prevent fraud, and communicate important updates about your account.' },
          { title: '3. Data Security', content: 'We implement industry-standard security measures including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.' },
          { title: '4. Third-Party Sharing', content: 'We do not sell your personal data. We may share information with payment processors, regulatory authorities (as required by law), and service providers who assist in operating our platform.' },
          { title: '5. Cookies', content: 'We use cookies and similar technologies to improve user experience, analyze usage patterns, and maintain session security. You can manage cookie preferences in your browser settings.' },
          { title: '6. Your Rights', content: 'You have the right to access, correct, or delete your personal information. Contact support@betpro.com for any privacy-related requests.' },
          { title: '7. Data Retention', content: 'We retain personal data for as long as your account is active and for a period thereafter as required by regulatory obligations.' },
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
