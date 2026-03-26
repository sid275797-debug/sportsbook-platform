import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import OddsButton from '../components/OddsButton'
import { fixturesApi, cricketApi } from '../lib/api'

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
    id: string; name: string
    outcomes: Array<{ id: string; name: string; odds: number; suspended?: boolean }>
  }>
}

const SPORT_EMOJI: Record<string, string> = {
  cricket: '🏏', football: '⚽', tennis: '🎾',
  basketball: '🏀', hockey: '🏒', baseball: '⚾',
}

const HERO_BANNERS = [
  { label: 'IPL 2026', sub: 'Live & Upcoming matches', color: '#f0a500', emoji: '🏏', href: '/cricket/ipl' },
  { label: 'Live Sports', sub: 'In-Play betting • Best Odds', color: '#00d4aa', emoji: '⚽', href: '/sportsbook?live=true' },
  { label: 'Casino Crash', sub: 'Up to 1000x multiplier', color: '#e03f3f', emoji: '🚀', href: '/casino/crash' },
]

export default function Home() {
  const [liveFixtures, setLiveFixtures] = useState<Fixture[]>([])
  const [upcomingFixtures, setUpcomingFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [liveRes, upcomingRes] = await Promise.allSettled([
          fixturesApi.live(),
          fixturesApi.upcoming({ limit: 10 }),
        ])
        if (liveRes.status === 'fulfilled') {
          const d = liveRes.value.data?.data ?? liveRes.value.data ?? []
          setLiveFixtures(Array.isArray(d) ? d : [])
        }
        if (upcomingRes.status === 'fulfilled') {
          const d = upcomingRes.value.data?.data ?? upcomingRes.value.data ?? []
          setUpcomingFixtures(Array.isArray(d) ? d : [])
        }
      } catch {}
      setLoading(false)
    }
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <Layout>
      <Head>
        <title>BetPro — Sports Betting & Casino</title>
        <meta name="description" content="Bet on cricket, football, tennis and more. Play crash, dice, roulette." />
      </Head>
      <div className="fade-up">
        {/* ── HERO BANNERS ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 2, height: 200,
          background: 'var(--bg-base)',
        }}>
          {HERO_BANNERS.map((b, i) => (
            <Link key={i} href={b.href} style={{
              background: `linear-gradient(135deg, ${b.color}18 0%, var(--bg-card) 100%)`,
              border: `1px solid ${b.color}30`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: '20px 24px', position: 'relative', overflow: 'hidden', cursor: 'pointer',
            }}>
              <div style={{
                position: 'absolute', top: 16, right: 20,
                fontSize: i === 0 ? 72 : 52, opacity: 0.12,
              }}>{b.emoji}</div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                color: b.color, textTransform: 'uppercase' as const, marginBottom: 6,
              }}>{b.sub}</div>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: i === 0 ? 28 : 22, color: 'var(--text-primary)', lineHeight: 1.1,
              }}>{b.label}</div>
              <div style={{
                marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6,
                background: b.color, color: '#000', padding: '5px 12px', borderRadius: 4,
                fontSize: 11, fontWeight: 700, letterSpacing: 0.5, width: 'fit-content',
              }}>BET NOW →</div>
            </Link>
          ))}
        </div>

        {/* ── QUICK NAV ── */}
        <div style={{ display: 'flex', gap: 8, padding: '16px 24px', overflowX: 'auto' }}>
          {Object.entries(SPORT_EMOJI).map(([slug, emoji]) => (
            <Link key={slug} href={`/sportsbook?sport=${slug}`} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '8px 16px',
              fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>
              <span>{emoji}</span>
              <span style={{ textTransform: 'capitalize' as const }}>{slug}</span>
            </Link>
          ))}
        </div>

        {/* ── LIVE MATCHES ── */}
        {liveFixtures.length > 0 && (
          <section style={{ padding: '0 24px 24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="live-dot" />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>
                  LIVE NOW
                </span>
                <span style={{
                  background: 'var(--live-red)', color: '#fff', borderRadius: 10,
                  fontSize: 11, fontWeight: 700, padding: '1px 8px',
                }}>{liveFixtures.length}</span>
              </div>
              <Link href="/sportsbook?live=true" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
                View all →
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {liveFixtures.slice(0, 5).map(f => (
                <FixtureRow key={f.id} fixture={f} />
              ))}
            </div>
          </section>
        )}

        {/* ── UPCOMING ── */}
        <section style={{ padding: '0 24px 40px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: 0.5 }}>
              UPCOMING MATCHES
            </span>
            <Link href="/sportsbook" style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              Loading fixtures...
            </div>
          ) : upcomingFixtures.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              No upcoming fixtures. Check back soon!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcomingFixtures.map(f => (
                <FixtureRow key={f.id} fixture={f} />
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}

function FixtureRow({ fixture: f }: { fixture: Fixture }) {
  const mainMarket = f.markets?.[0]
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Sport icon */}
      <span style={{ fontSize: 20, flexShrink: 0 }}>
        {SPORT_EMOJI[f.sport?.slug] ?? '🏟️'}
      </span>

      {/* Teams */}
      <Link href={`/fixture/${f.id}`} style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {f.homeTeam?.name} vs {f.awayTeam?.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {f.competition?.name}
          {f.isLive && f.liveScore && (
            <span style={{ color: 'var(--live-red)', fontWeight: 700, marginLeft: 8 }}>
              LIVE {f.liveScore.homeScore}–{f.liveScore.awayScore}
            </span>
          )}
          {!f.isLive && f.startsAt && (
            <span style={{ marginLeft: 8 }}>
              {new Date(f.startsAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </Link>

      {/* Odds */}
      {mainMarket && (
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {mainMarket.outcomes?.slice(0, 3).map(o => (
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
    </div>
  )
}
