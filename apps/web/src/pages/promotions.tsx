import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'

const PROMOS = [
  {
    id: 'welcome',
    emoji: '🎁',
    tag: 'NEW MEMBERS',
    tagColor: '#00d4aa',
    title: '100% Welcome Bonus',
    subtitle: 'Up to ₹10,000',
    desc: 'Make your first deposit and we\'ll match it 100%. Start betting with double your money.',
    steps: ['Register a new account', 'Make your first deposit (min ₹500)', 'Bonus credited instantly', 'Wager 5× to withdraw'],
    cta: 'CLAIM BONUS',
    ctaHref: '/register',
    gradient: 'rgba(0,212,170,0.08)',
    border: 'rgba(0,212,170,0.3)',
  },
  {
    id: 'reload',
    emoji: '🔄',
    tag: 'WEEKLY',
    tagColor: '#f0a500',
    title: '20% Reload Bonus',
    subtitle: 'Every Monday',
    desc: 'Every Monday get a 20% bonus on your deposit. Max bonus ₹2,000. Keep the winning streak going.',
    steps: ['Available every Monday', 'Deposit min ₹1,000', 'Get 20% bonus credited', 'Wager 3× to withdraw'],
    cta: 'DEPOSIT NOW',
    ctaHref: '/wallet/deposit',
    gradient: 'rgba(240,165,0,0.08)',
    border: 'rgba(240,165,0,0.3)',
  },
  {
    id: 'cashback',
    emoji: '💸',
    tag: 'DAILY',
    tagColor: '#8b5cf6',
    title: '10% Cashback',
    subtitle: 'On net losses',
    desc: 'Lost today? We give back 10% of your net daily losses every midnight. No strings attached.',
    steps: ['Automatically calculated', 'Based on net daily losses', 'Credited every midnight', 'No wagering requirement'],
    cta: 'START BETTING',
    ctaHref: '/sportsbook',
    gradient: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.3)',
  },
  {
    id: 'refer',
    emoji: '👥',
    tag: 'ONGOING',
    tagColor: '#3b82f6',
    title: 'Refer & Earn',
    subtitle: '₹500 per friend',
    desc: 'Invite your friends and earn ₹500 for every friend who registers and deposits. No limit!',
    steps: ['Share your referral link', 'Friend registers & deposits ₹1,000+', 'You earn ₹500 instantly', 'Friend gets ₹250 bonus'],
    cta: 'GET REFERRAL LINK',
    ctaHref: '/dashboard',
    gradient: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.3)',
  },
  {
    id: 'ipl',
    emoji: '🏏',
    tag: 'IPL 2025',
    tagColor: '#e03f3f',
    title: 'IPL Super Odds',
    subtitle: 'Enhanced markets',
    desc: 'Get the best odds on all IPL 2025 matches. Special accumulators with boosted payouts.',
    steps: ['Available on all IPL matches', 'Boosted match winner odds', 'Special player markets', 'Live in-play betting'],
    cta: 'BET ON IPL',
    ctaHref: '/sportsbook?sport=cricket',
    gradient: 'rgba(224,63,63,0.08)',
    border: 'rgba(224,63,63,0.3)',
  },
  {
    id: 'vip',
    emoji: '👑',
    tag: 'VIP',
    tagColor: '#f0a500',
    title: 'VIP Program',
    subtitle: '5 Levels of rewards',
    desc: 'The more you play, the more you earn. Exclusive bonuses, higher limits, personal manager.',
    steps: ['Bronze → Silver → Gold → Platinum → Diamond', 'Higher withdrawal limits', 'Personal account manager', 'Exclusive promotions & events'],
    cta: 'VIEW VIP LEVELS',
    ctaHref: '/promotions/vip',
    gradient: 'rgba(240,165,0,0.08)',
    border: 'rgba(240,165,0,0.3)',
  },
]

export default function Promotions() {
  return (
    <Layout>
      <Head><title>Promotions — BetPro</title></Head>
      <div style={{ padding: '0 0 40px' }}>

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, #0d1a14 0%, #0a1220 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '40px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, marginBottom: 8 }}>
            🎁 PROMOTIONS & BONUSES
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
            Exclusive offers for BetPro members. New bonuses added weekly.
          </div>
        </div>

        <div style={{ padding: '24px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {PROMOS.map(p => (
            <div key={p.id} style={{
              background: p.gradient,
              border: `1px solid ${p.border}`,
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 36 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ background: p.tagColor, color: '#000', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>
                      {p.tag}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{p.title}</div>
                  <div style={{ color: p.tagColor, fontWeight: 700, fontSize: 15 }}>{p.subtitle}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.desc}</div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {p.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12 }}>
                    <span style={{ color: p.tagColor, fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{step}</span>
                  </div>
                ))}
              </div>

              <Link href={p.ctaHref} style={{
                display: 'block', textAlign: 'center',
                background: p.tagColor, color: '#000',
                padding: '11px', borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: 0.5,
                marginTop: 'auto',
              }}>{p.cta} →</Link>
            </div>
          ))}
        </div>

        {/* T&C note */}
        <div style={{ textAlign: 'center', padding: '0 24px', fontSize: 11, color: 'var(--text-muted)' }}>
          All bonuses subject to terms & conditions. Responsible gambling — play within your means. 18+ only.
        </div>
      </div>
    </Layout>
  )
}
