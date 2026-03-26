import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuthStore } from '../store'
import { walletApi } from '../lib/api'
import Footer from './Footer'
import LiveTicker from './LiveTicker'

const NAV_SPORTS = [
  { icon: '🏏', label: 'Cricket',      slug: 'cricket' },
  { icon: '⚽', label: 'Football',     slug: 'football' },
  { icon: '🎾', label: 'Tennis',       slug: 'tennis' },
  { icon: '🏀', label: 'Basketball',   slug: 'basketball' },
  { icon: '🤼', label: 'Kabaddi',      slug: 'kabaddi' },
  { icon: '🏐', label: 'Volleyball',   slug: 'volleyball' },
  { icon: '🏓', label: 'Table Tennis', slug: 'table_tennis' },
  { icon: '🐎', label: 'Horse Racing', slug: 'horse_racing' },
]

const CASINO_GAMES = [
  { icon: '🚀', label: 'Crash',       href: '/casino/crash' },
  { icon: '🎲', label: 'Dice',        href: '/casino/dice' },
  { icon: '🎡', label: 'Roulette',    href: '/casino/roulette' },
  { icon: '🃏', label: 'Blackjack',   href: '/casino/blackjack' },
  { icon: '📌', label: 'Plinko',      href: '/casino/plinko' },
  { icon: '🎴', label: 'Andar Bahar', href: '/casino/andar-bahar' },
  { icon: '🎴', label: 'Teen Patti',  href: '/casino/teen-patti' },
  { icon: '🎰', label: 'Baccarat',    href: '/casino/baccarat' },
]

const CRICKET_LINKS = [
  { icon: '🔴', label: 'Live Scores', href: '/cricket/live' },
  { icon: '🏆', label: 'IPL 2026',    href: '/cricket/ipl' },
  { icon: '🎯', label: 'Bet on Cricket', href: '/cricket/betting' },
]

interface LayoutProps {
  children: React.ReactNode
  hideSidebar?: boolean
}

export default function Layout({ children, hideSidebar = false }: LayoutProps) {
  const router = useRouter()
  const { user, balance, setBalance, logout } = useAuthStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => { setUserMenuOpen(false) }, [router.pathname])

  // Refresh balance on mount if logged in
  useEffect(() => {
    if (user) {
      walletApi.balance()
        .then(r => setBalance(r.data.data?.available ?? r.data.available ?? 0))
        .catch(() => {})
    }
  }, [user, setBalance])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* TOP NAV */}
      <nav style={{
        height: 'var(--nav-height)', background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        position: 'sticky', top: 0, zIndex: 100, gap: 0,
      }}>
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 24, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dim))',
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#000',
          }}>B</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: 0.5 }}>
            BET<span style={{ color: 'var(--accent)' }}>PRO</span>
          </span>
        </Link>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: 0, flex: 1, overflowX: 'auto' }}>
          {[
            { href: '/',             label: 'Home' },
            { href: '/sportsbook',   label: '⚽ Sports' },
            { href: '/cricket/live', label: '🏏 Cricket' },
            { href: '/cricket/ipl',  label: '🏆 IPL' },
            { href: '/casino',       label: '🎰 Casino' },
            { href: '/promotions',   label: '🎁 Promos' },
          ].map(({ href, label }) => {
            const active = router.pathname === href || (href !== '/' && router.pathname.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                padding: '0 14px', height: 'var(--nav-height)',
                display: 'flex', alignItems: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, letterSpacing: 0.4,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'color 0.15s',
              }}>{label}</Link>
            )
          })}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 16, flexShrink: 0 }}>
          {user ? (
            <>
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '5px 12px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>BAL</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)', fontSize: 13 }}>
                  ₹{balance?.toLocaleString('en-IN') ?? '0'}
                </span>
              </div>
              <Link href="/wallet/deposit" style={{
                background: 'var(--accent)', color: '#000',
                padding: '7px 14px', borderRadius: 'var(--radius)',
                fontWeight: 700, fontSize: 12, fontFamily: 'var(--font-display)', letterSpacing: 0.5,
              }}>+ DEPOSIT</Link>
              {/* User menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-bright)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer',
                  }}>{user.username?.[0]?.toUpperCase() ?? 'U'}</button>
                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', right: 0, top: 40,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', minWidth: 180, zIndex: 200,
                    overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{user.username}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    {[
                      { label: '👤 My Account', href: '/dashboard' },
                      { label: '🎯 My Bets',    href: '/bets' },
                      { label: '💰 Deposit',    href: '/wallet/deposit' },
                      { label: '⬆️ Withdraw',  href: '/wallet/withdraw' },
                    ].map(item => (
                      <Link key={item.href} href={item.href} style={{
                        display: 'block', padding: '10px 16px',
                        fontSize: 13, color: 'var(--text-secondary)',
                        borderBottom: '1px solid var(--border)',
                      }}>{item.label}</Link>
                    ))}
                    <button onClick={logout} style={{
                      display: 'block', width: '100%', padding: '10px 16px',
                      background: 'none', border: 'none', textAlign: 'left' as const,
                      fontSize: 13, color: 'var(--live-red)', cursor: 'pointer',
                    }}>🚪 Log Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" style={{
                color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13,
                padding: '7px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              }}>LOG IN</Link>
              <Link href="/register" style={{
                background: 'var(--accent)', color: '#000',
                padding: '7px 16px', borderRadius: 'var(--radius)',
                fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-display)', letterSpacing: 0.5,
              }}>JOIN NOW</Link>
            </>
          )}
        </div>
      </nav>

      {/* LIVE TICKER */}
      <LiveTicker />

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* SIDEBAR */}
        {!hideSidebar && (
          <aside style={{
            width: 'var(--sidebar-width)',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border)',
            position: 'sticky',
            top: 'var(--nav-height)',
            height: 'calc(100vh - var(--nav-height))',
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <Link href="/sportsbook?live=true" style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              background: 'rgba(224,63,63,0.08)', borderBottom: '1px solid rgba(224,63,63,0.2)',
              fontSize: 12, fontWeight: 700, color: 'var(--live-red)',
            }}>
              <span className="live-dot" /> LIVE NOW
            </Link>

            {/* Cricket */}
            <div style={{ padding: '10px 0' }}>
              <div style={{ padding: '6px 16px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>🏏 Cricket</div>
              {CRICKET_LINKS.map(c => (
                <Link key={c.href} href={c.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px', fontSize: 13, fontWeight: 500,
                  color: router.pathname === c.href ? 'var(--accent)' : 'var(--text-secondary)',
                  background: router.pathname === c.href ? 'var(--accent-glow)' : 'transparent',
                  borderLeft: router.pathname === c.href ? '2px solid var(--accent)' : '2px solid transparent',
                }}>
                  <span>{c.icon}</span>{c.label}
                </Link>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* All Sports */}
            <div style={{ padding: '10px 0' }}>
              <div style={{ padding: '6px 16px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>All Sports</div>
              {NAV_SPORTS.map(s => (
                <Link key={s.slug} href={`/sportsbook?sport=${s.slug}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px', fontSize: 13, fontWeight: 500,
                  color: router.query.sport === s.slug ? 'var(--accent)' : 'var(--text-secondary)',
                  background: router.query.sport === s.slug ? 'var(--accent-glow)' : 'transparent',
                  borderLeft: router.query.sport === s.slug ? '2px solid var(--accent)' : '2px solid transparent',
                }}>
                  <span>{s.icon}</span>{s.label}
                </Link>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Casino */}
            <div style={{ padding: '10px 0' }}>
              <div style={{ padding: '6px 16px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Casino</div>
              {CASINO_GAMES.map(g => (
                <Link key={g.href} href={g.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px', fontSize: 13, fontWeight: 500,
                  color: router.pathname === g.href ? 'var(--accent)' : 'var(--text-secondary)',
                  background: router.pathname === g.href ? 'var(--accent-glow)' : 'transparent',
                  borderLeft: router.pathname === g.href ? '2px solid var(--accent)' : '2px solid transparent',
                }}>
                  <span>{g.icon}</span>{g.label}
                </Link>
              ))}
            </div>
            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Account */}
            <div style={{ padding: '10px 0' }}>
              <div style={{ padding: '6px 16px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Account</div>
              {[
                { icon: '🎯', label: 'My Bets',    href: '/bets' },
                { icon: '💰', label: 'Deposit',    href: '/wallet/deposit' },
                { icon: '🎁', label: 'Promotions', href: '/promotions' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 16px', fontSize: 13, fontWeight: 500,
                  color: router.pathname === item.href ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  <span>{item.icon}</span>{item.label}
                </Link>
              ))}
            </div>
          </aside>
        )}

        {/* MAIN */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
