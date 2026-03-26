import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border)',
      marginTop: 'auto',
    }}>
      {/* Main footer links */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 32,
        padding: '32px 40px',
        maxWidth: 1400,
        margin: '0 auto',
      }}>
        {[
          {
            title: 'Sports',
            links: [
              { label: 'Cricket', href: '/sportsbook?sport=cricket' },
              { label: 'Football', href: '/sportsbook?sport=football' },
              { label: 'Tennis', href: '/sportsbook?sport=tennis' },
              { label: 'Basketball', href: '/sportsbook?sport=basketball' },
              { label: 'Live Betting', href: '/sportsbook?live=true' },
            ],
          },
          {
            title: 'Casino',
            links: [
              { label: 'Crash', href: '/casino/crash' },
              { label: 'Dice', href: '/casino/dice' },
              { label: 'Roulette', href: '/casino/roulette' },
              { label: 'Blackjack', href: '/casino/blackjack' },
              { label: 'Plinko', href: '/casino/plinko' },
            ],
          },
          {
            title: 'Promotions',
            links: [
              { label: 'Welcome Bonus', href: '/promotions' },
              { label: 'Reload Bonus', href: '/promotions' },
              { label: 'Cashback', href: '/promotions' },
              { label: 'Refer a Friend', href: '/promotions' },
              { label: 'VIP Program', href: '/promotions/vip' },
            ],
          },
          {
            title: 'Account',
            links: [
              { label: 'Register', href: '/register' },
              { label: 'Log In', href: '/login' },
              { label: 'Deposit', href: '/wallet/deposit' },
              { label: 'Withdraw', href: '/wallet/withdraw' },
              { label: 'My Bets', href: '/bets' },
            ],
          },
          {
            title: 'Information',
            links: [
              { label: 'About Us', href: '/about' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Responsible Gambling', href: '/responsible-gambling' },
              { label: 'Contact Us', href: '/contact' },
            ],
          },
        ].map(section => (
          <div key={section.title}>
            <div style={{
              fontSize: 11, fontWeight: 800, letterSpacing: 1.2,
              color: 'var(--text-secondary)', textTransform: 'uppercase' as const,
              marginBottom: 14,
            }}>{section.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
              {section.links.map(link => (
                <Link key={link.label + link.href} href={link.href} style={{
                  fontSize: 13, color: 'var(--text-muted)',
                  transition: 'color 0.15s',
                }}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Payment methods */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 40px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' as const }}>
            Payment Methods
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {['UPI', 'PhonePe', 'Google Pay', 'Paytm', 'Net Banking', 'IMPS', 'NEFT', 'Bitcoin', 'USDT', 'ETH'].map(m => (
              <span key={m} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '5px 12px', fontSize: 11,
                color: 'var(--text-secondary)', fontWeight: 600,
              }}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 40px',
        background: 'var(--bg-base)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap' as const,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 28, height: 28,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
              borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#000',
            }}>B</div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              © 2026 BetPro. All rights reserved.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '4px 10px', fontSize: 11,
              color: 'var(--text-secondary)', fontWeight: 700,
            }}>18+</span>
            <span style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '4px 10px', fontSize: 11,
              color: 'var(--accent)', fontWeight: 700,
            }}>Provably Fair</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.5 }}>
            Gambling can be addictive. Play responsibly. BetPro supports responsible gambling.
          </div>
        </div>
      </div>
    </footer>
  )
}
