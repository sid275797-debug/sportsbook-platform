import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import Layout from '../components/Layout'
import OddsButton from '../components/OddsButton'

interface Fixture {
  id: string
  homeTeam: { name: string; shortName?: string }
  awayTeam: { name: string; shortName?: string }
  sport: { name: string; slug: string }
  competition: { name: string }
  startsAt: string
  isLive: boolean
  liveScore?: { homeScore: number; awayScore: number; minute?: number }
  markets?: Array<{
    id: string
    name: string
    outcomes: Array<{ id: string; name: string; odds: number; suspended?: boolean }>
  }>
}

interface HomeProps {
  liveFixtures: Fixture[]
  upcomingFixtures: Fixture[]
}

const SPORT_EMOJI: Record<string, string> = {
  cricket: '🏏', football: '⚽', tennis: '🎾',
  basketball: '🏀', hockey: '🏒', baseball: '⚾',
  kabaddi: '🤼', volleyball: '🏐', table_tennis: '🏓',
  horse_racing: '🐎',
}

const HERO_BANNERS = [
  { label: 'IPL 2026', sub: 'Live & Upcoming Matches', color: '#f0a500', emoji: '🏏', href: '/cricket/ipl' },
  { label: 'UEFA Champions League', sub: 'Quarter Finals • Live Now', color: '#00d4aa', emoji: '⚽', href: '/sportsbook?sport=football' },
  { label: 'Casino Crash', sub: 'Up to 1000x multiplier', color: '#e03f3f', emoji: '🚀', href: '/casino/crash' },
]

const CASINO_GAMES = [
  { emoji: '🚀', name: 'Crash',       href: '/casino/crash',       color: '#e03f3f', desc: 'Up to 1000x' },
  { emoji: '🎲', name: 'Dice',        href: '/casino/dice',        color: '#f0a500', desc: 'Provably Fair' },
  { emoji: '🎡', name: 'Roulette',    href: '/casino/roulette',    color: '#00d4aa', desc: 'European' },
  { emoji: '🃏', name: 'Blackjack',   href: '/casino/blackjack',   color: '#8b5cf6', desc: 'Classic 21' },
  { emoji: '📌', name: 'Plinko',      href: '/casino/plinko',      color: '#3b82f6', desc: 'High RTP' },
  { emoji: '🎴', name: 'Andar Bahar', href: '/casino/andar-bahar', color: '#f0a500', desc: 'Indian Classic' },
  { emoji: '🎴', name: 'Teen Patti',  href: '/casino/teen-patti',  color: '#c084fc', desc: '3-Card Poker' },
  { emoji: '🎰', name: 'Baccarat',    href: '/casino/baccarat',    color: '#22c55e', desc: 'Punto Banco' },
]

export default function Home({ liveFixtures, upcomingFixtures }: HomeProps) {
  return (
    <Layout>
      <Head>
        <title>BetPro — Sports Betting & Casino</title>
        <meta name="description" content="Bet on cricket, football, tennis and more. Play crash, dice, roulette." />
      </Head>

      <div style={{ padding: '0' }} className="fade-up">

        {/* ── HERO BANNERS ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 2,
          height: 200,
          background: 'var(--bg-base)',
        }}>
          {HERO_BANNERS.map((b, i) => (
            <Link key={i} href={b.href} style={{
              background: `linear-gradient(135deg, ${b.color}18 0%, var(--bg-card) 100%)`,
              border: `1px solid ${b.color}30`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '20px 24px',
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
            }}>
              <div style={{
                position: 'absolute', top: 16, right: 20,
                fontSize: i === 0 ? 72 : 52,
                opacity: 0.12,
              }}>{b.emoji}</div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                color: b.color, textTransform: 'uppercase', marginBottom: 6,
              }}>{b.sub}</div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: i === 0 ? 28 : 22,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
              }}>{b.label}</div>
              <div style={{
                marginTop: 12,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: b.color,
                color: '#000',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.5,
                width: 'fit-content',
              }}>BET NOW →</div>
            </Link>
          ))}
        </div>

        {/* ── QUICK NAV SPORTS ── */}
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
        }}>
          {[
            { label: 'All',          href: '/sportsbook' },
            { label: '⚽ Football',  href: '/sportsbook?sport=football' },
            { label: '🏏 Cricket',   href: '/cricket/live' },
            { label: '🏆 IPL 2026',  href: '/cricket/ipl' },
            { label: '🎾 Tennis',    href: '/sportsbook?sport=tennis' },
            { label: '🏀 Basketball',href: '/sportsbook?sport=basketball' },
            { label: '🤼 Kabaddi',   href: '/sportsbook?sport=kabaddi' },
            { label: '🎰 Casino',    href: '/casino' },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{
              padding: '6px 14px',
              borderRadius: 20,
              border: '1px solid var(--border)',
              background: label === 'All' ? 'var(--accent)' : 'var(--bg-card)',
              color: label === 'All' ? '#000' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}>{label}</Link>
          ))}
        </div>

        <div style={{ padding: '16px' }}>

          {/* ── LIVE NOW ── */}
          {liveFixtures.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className="live-dot" />
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
                }}>LIVE NOW</span>
                <span style={{
                  background: 'var(--live-red)', color: '#fff',
                  borderRadius: 3, fontSize: 10, fontWeight: 700,
                  padding: '2px 7px',
                }}>{liveFixtures.length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {liveFixtures.map((f) => (
                  <FixtureRow key={f.id} fixture={f} isLive />
                ))}
              </div>
            </section>
          )}

          {/* ── UPCOMING ── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
              }}>UPCOMING MATCHES</span>
              <Link href="/sportsbook" style={{
                fontSize: 12, color: 'var(--accent)', fontWeight: 600,
              }}>View all →</Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {upcomingFixtures.map((f) => (
                <FixtureRow key={f.id} fixture={f} />
              ))}
              {upcomingFixtures.length === 0 && (
                <div style={{
                  textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0', fontSize: 13,
                }}>No upcoming fixtures right now</div>
              )}
            </div>
          </section>

          {/* ── CRICKET SPOTLIGHT ── */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>
                🏏 CRICKET
              </span>
              <Link href="/cricket/live" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Live scores →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: '🔴 Live Scores', desc: 'Real-time match updates', href: '/cricket/live', color: '#e03f3f' },
                { label: '🏆 IPL 2026',    desc: 'Teams, schedule & points', href: '/cricket/ipl',  color: '#f0a500' },
                { label: '🎯 Bet on Cricket', desc: 'Toss, runs, wickets & more', href: '/cricket/betting', color: '#00d4aa' },
              ].map(c => (
                <Link key={c.href} href={c.href} style={{
                  background: `linear-gradient(135deg, ${c.color}15, var(--bg-card))`,
                  border: `1px solid ${c.color}30`,
                  borderRadius: 'var(--radius-lg)', padding: '20px',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: c.color }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.desc}</div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── CASINO GAMES ── */}
          <section style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: 18, letterSpacing: 0.5,
              }}>CASINO GAMES</span>
              <Link href="/casino" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {CASINO_GAMES.map((g) => (
                <Link key={g.href} href={g.href} style={{
                  background: `linear-gradient(135deg, ${g.color}22 0%, var(--bg-card) 100%)`,
                  border: `1px solid ${g.color}40`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  textAlign: 'center',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)' }}
                >
                  <span style={{ fontSize: 30 }}>{g.emoji}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>
                    {g.name}
                  </span>
                  <span style={{ fontSize: 10, color: g.color }}>{g.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  )
}

// ─── Fixture Row ──────────────────────────────────────────────────────────────

function FixtureRow({ fixture: f, isLive = false }: { fixture: Fixture; isLive?: boolean }) {
  const mainMarket = f.markets?.[0]
  const sport = f.sport?.slug ?? 'football'
  const emoji = SPORT_EMOJI[sport] ?? '🏟️'

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
    >
      {/* Sport + Time */}
      <div style={{ width: 140, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {isLive && <span className="live-dot" />}
          <span style={{ fontSize: 11, color: isLive ? 'var(--live-red)' : 'var(--text-muted)', fontWeight: 600 }}>
            {isLive ? 'LIVE' : formatTime(f.startsAt)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>{emoji}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {f.competition?.name}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/fixture/${f.id}`} style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600, fontSize: 14, color: 'var(--text-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{f.homeTeam?.name}</div>
              <div style={{
                fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginTop: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{f.awayTeam?.name}</div>
            </div>
            {isLive && f.liveScore && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
                  {f.liveScore.homeScore}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>
                  {f.liveScore.awayScore}
                </div>
              </div>
            )}
          </div>
        </Link>
      </div>

      {/* Odds */}
      {mainMarket && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {mainMarket.outcomes.slice(0, 3).map((o) => (
            <OddsButton
              key={o.id}
              fixtureId={f.id}
              marketId={mainMarket.id}
              outcomeId={o.id}
              label={o.name}
              odds={o.odds}
              suspended={o.suspended}
            />
          ))}
        </div>
      )}

      {/* More markets link */}
      <Link href={`/fixture/${f.id}`} style={{
        fontSize: 11, color: 'var(--text-muted)', flexShrink: 0,
        padding: '4px 8px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        whiteSpace: 'nowrap',
      }}>
        +{(f.markets?.length ?? 1) - 1} more
      </Link>
    </div>
  )
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

// ─── SSR ──────────────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async () => {
  const API = process.env.GATEWAY_URL ?? 'http://localhost:4000'
  try {
    const [liveRes, upcomingRes] = await Promise.allSettled([
      axios.get(`${API}/api/fixtures/live`),
      axios.get(`${API}/api/fixtures/upcoming?limit=12&includeMarkets=true`),
    ])
    return {
      props: {
        liveFixtures:     liveRes.status === 'fulfilled' ? liveRes.value.data.data ?? [] : [],
        upcomingFixtures: upcomingRes.status === 'fulfilled' ? upcomingRes.value.data.data ?? [] : [],
      },
    }
  } catch {
    return { props: { liveFixtures: [], upcomingFixtures: [] } }
  }
}
