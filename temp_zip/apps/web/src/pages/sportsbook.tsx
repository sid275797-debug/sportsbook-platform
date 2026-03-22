import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useState } from 'react'
import axios from 'axios'
import Layout from '../components/Layout'
import Betslip from '../components/Betslip'
import OddsButton from '../components/OddsButton'

interface Outcome  { id: string; name: string; odds: number; suspended?: boolean }
interface Market   { id: string; name: string; type: string; outcomes: Outcome[] }
interface Fixture  {
  id: string
  homeTeam: { name: string; shortName?: string; logo?: string }
  awayTeam: { name: string; shortName?: string; logo?: string }
  sport: { name: string; slug: string }
  competition: { id: string; name: string; country?: string }
  startsAt: string
  isLive: boolean
  liveScore?: { homeScore: number; awayScore: number; minute?: number; period?: string }
  markets?: Market[]
  marketCount?: number
}

interface Comp { id: string; name: string; country?: string; fixtures: Fixture[] }

interface SportsbookProps {
  sport: string
  comps: Comp[]
}

const SPORT_TABS = [
  { slug: 'all',              label: 'All Sports',   emoji: '🌍' },
  { slug: 'football',        label: 'Football',      emoji: '⚽' },
  { slug: 'cricket',         label: 'Cricket',       emoji: '🏏' },
  { slug: 'tennis',          label: 'Tennis',        emoji: '🎾' },
  { slug: 'basketball',      label: 'Basketball',    emoji: '🏀' },
  { slug: 'hockey',          label: 'Hockey',        emoji: '🏒' },
  { slug: 'american-football', label: 'NFL',         emoji: '🏈' },
]

export default function Sportsbook({ sport, comps }: SportsbookProps) {
  const [expandedFixture, setExpandedFixture] = useState<string | null>(null)
  const [activeComp, setActiveComp] = useState<string | null>(null)

  const displayComps = activeComp ? comps.filter(c => c.id === activeComp) : comps

  return (
    <Layout>
      <Head>
        <title>Sportsbook — BetPro</title>
      </Head>

      <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-height))' }}>

        {/* ── LEFT: COMPETITIONS FILTER ── */}
        <div style={{
          width: 200,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          overflowY: 'auto',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Sport filter tabs */}
          <div style={{ padding: '8px 0' }}>
            <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Sports
            </div>
            {SPORT_TABS.map((s) => (
              <Link key={s.slug} href={s.slug === 'all' ? '/sportsbook' : `/sportsbook?sport=${s.slug}`} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                fontSize: 12, fontWeight: 500,
                color: sport === s.slug || (s.slug === 'all' && !sport)
                  ? 'var(--accent)' : 'var(--text-secondary)',
                background: sport === s.slug || (s.slug === 'all' && !sport)
                  ? 'var(--accent-glow)' : 'transparent',
              }}>
                <span>{s.emoji}</span>{s.label}
              </Link>
            ))}
          </div>

          {comps.length > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '6px 12px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Competitions
                </div>
                <button
                  onClick={() => setActiveComp(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 12px', width: '100%', background: 'none',
                    color: !activeComp ? 'var(--accent)' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 500,
                    borderLeft: !activeComp ? '2px solid var(--accent)' : '2px solid transparent',
                  }}
                >All Competitions</button>
                {comps.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveComp(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 12px', width: '100%', background: 'none',
                      color: activeComp === c.id ? 'var(--accent)' : 'var(--text-secondary)',
                      fontSize: 12, fontWeight: 500, textAlign: 'left',
                      borderLeft: activeComp === c.id ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {c.name}
                    </span>
                    <span style={{
                      background: 'var(--bg-elevated)', borderRadius: 10,
                      fontSize: 10, padding: '1px 5px', color: 'var(--text-muted)', flexShrink: 0,
                    }}>{c.fixtures.length}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── CENTRE: FIXTURE LIST ── */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>

          {/* Sub-tabs: Live / Today / Tomorrow / All */}
          <div style={{
            display: 'flex', gap: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            {['Live', 'Today', 'Tomorrow', 'All'].map((t, i) => (
              <button key={t} style={{
                padding: '11px 20px',
                background: 'none',
                color: i === 0 ? 'var(--live-red)' : i === 1 ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: i <= 1 ? `2px solid ${i === 0 ? 'var(--live-red)' : 'var(--accent)'}` : '2px solid transparent',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 0.5,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {i === 0 && <span className="live-dot" />}
                {t}
              </button>
            ))}
          </div>

          <div style={{ padding: '12px 16px' }}>
            {displayComps.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
                <div>No fixtures available right now</div>
              </div>
            ) : (
              displayComps.map((comp) => (
                <CompetitionGroup
                  key={comp.id}
                  comp={comp}
                  expandedFixture={expandedFixture}
                  setExpanded={setExpandedFixture}
                />
              ))
            )}
          </div>
        </div>

        {/* ── RIGHT: BETSLIP ── */}
        <Betslip />
      </div>
    </Layout>
  )
}

// ─── Competition Group ────────────────────────────────────────────────────────

function CompetitionGroup({ comp, expandedFixture, setExpanded }: {
  comp: Comp
  expandedFixture: string | null
  setExpanded: (id: string | null) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          width: '100%', background: 'none',
          padding: '8px 12px',
          marginBottom: 2,
        }}
      >
        <span style={{
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
          transition: 'transform 0.2s',
          color: 'var(--text-muted)',
          fontSize: 10,
        }}>▼</span>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700, fontSize: 13,
          letterSpacing: 0.4,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
        }}>
          {comp.country && `${comp.country} • `}{comp.name}
        </span>
        <span style={{
          background: 'var(--bg-elevated)', borderRadius: 10,
          fontSize: 10, padding: '1px 6px', color: 'var(--text-muted)',
        }}>{comp.fixtures.length}</span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {comp.fixtures.map((f) => (
            <FixtureCard
              key={f.id}
              fixture={f}
              isExpanded={expandedFixture === f.id}
              onToggle={() => setExpanded(expandedFixture === f.id ? null : f.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Fixture Card ─────────────────────────────────────────────────────────────

function FixtureCard({ fixture: f, isExpanded, onToggle }: {
  fixture: Fixture
  isExpanded: boolean
  onToggle: () => void
}) {
  const mainMarket = f.markets?.[0]

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
    }}>
      {/* Row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      }}>
        {/* Time / Live badge */}
        <div style={{ width: 72, flexShrink: 0, textAlign: 'center' }}>
          {f.isLive ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <span className="live-dot" />
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--live-red)' }}>LIVE</span>
              </div>
              {f.liveScore?.minute && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {f.liveScore.minute}'
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              {formatTime(f.startsAt)}
            </div>
          )}
        </div>

        {/* Teams + Score */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{f.homeTeam?.name}</div>
              <div style={{
                fontSize: 13, fontWeight: 600, marginTop: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{f.awayTeam?.name}</div>
            </div>
            {f.isLive && f.liveScore && (
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 17, color: 'var(--accent)' }}>
                  {f.liveScore.homeScore}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 17, color: 'var(--accent)' }}>
                  {f.liveScore.awayScore}
                </div>
              </div>
            )}
          </div>
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
                label={o.name === 'Home' ? f.homeTeam.shortName ?? '1' : o.name === 'Away' ? f.awayTeam.shortName ?? '2' : o.name}
                odds={o.odds}
                suspended={o.suspended}
              />
            ))}
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={onToggle}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '5px 10px',
            fontSize: 11,
            color: 'var(--text-muted)',
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          +{(f.marketCount ?? f.markets?.length ?? 1) - 1}
          <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s', fontSize: 9 }}>▼</span>
        </button>
      </div>

      {/* Expanded markets */}
      {isExpanded && f.markets && f.markets.length > 1 && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {f.markets.slice(1).map((m) => (
            <div key={m.id}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8,
              }}>{m.name}</div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {m.outcomes.map((o) => (
                  <OddsButton
                    key={o.id}
                    fixtureId={f.id}
                    marketId={m.id}
                    outcomeId={o.id}
                    label={o.name}
                    odds={o.odds}
                    suspended={o.suspended}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

// ─── SSR ──────────────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const API = process.env.GATEWAY_URL ?? 'http://localhost:4000'
  const sport = (query.sport as string) ?? ''
  try {
    const params: any = { includeMarkets: true, limit: 50 }
    if (sport) params.sport = sport
    const { data } = await axios.get(`${API}/api/fixtures/upcoming`, { params })
    const fixtures: Fixture[] = data.data ?? []

    // Group by competition
    const compMap = new Map<string, Comp>()
    fixtures.forEach((f) => {
      const cid = f.competition?.id ?? 'other'
      if (!compMap.has(cid)) compMap.set(cid, { id: cid, name: f.competition?.name ?? 'Other', country: f.competition?.country, fixtures: [] })
      compMap.get(cid)!.fixtures.push(f)
    })

    return { props: { sport, comps: Array.from(compMap.values()) } }
  } catch {
    return { props: { sport, comps: [] } }
  }
}
