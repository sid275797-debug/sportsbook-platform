import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../../components/Layout'
import Betslip from '../../components/Betslip'
import OddsButton from '../../components/OddsButton'
import { fixturesApi, cricketApi } from '../../lib/api'

interface Outcome { id: string; name: string; odds: number; suspended?: boolean; line?: number }
interface Market  { id: string; name: string; type: string; outcomes: Outcome[] }
interface Fixture {
  id: string
  homeTeam: { name: string; shortName?: string }
  awayTeam: { name: string; shortName?: string }
  sport: { name: string; slug: string }
  competition: { name: string; country?: string }
  startsAt: string
  isLive: boolean
  liveScore?: { homeScore: number; awayScore: number; minute?: number; period?: string }
  markets: Market[]
  status?: string
}

const MARKET_GROUPS: Record<string, string[]> = {
  'Main Markets': ['match_winner', '1x2', 'both_teams_to_score', 'double_chance', 'winner'],
  'Goals / Runs': ['total_goals', 'total_runs', 'first_goal_scorer', 'anytime_goal_scorer', 'exact_goals'],
  'Session': ['powerplay', 'middle_overs', 'death_overs', 'session'],
  'Handicap': ['asian_handicap', 'european_handicap'],
  'Half Time': ['half_time_result', 'half_time_total'],
  'Specials': ['first_corner', 'total_corners', 'total_cards', 'man_of_match', 'toss'],
}

export default function FixtureDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [fixture, setFixture] = useState<Fixture | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState('Main Markets')

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        // Try cricket-specific endpoint first, fall back to generic
        let res
        try {
          res = await cricketApi.matchMarkets(id as string)
        } catch {
          res = await fixturesApi.markets(id as string)
        }
        const data = res.data?.data ?? res.data
        setFixture(data)
      } catch {
        // Try basic fixture detail without markets
        try {
          const res = await fixturesApi.detail(id as string)
          setFixture(res.data?.data ?? res.data)
        } catch {}
      }
      setLoading(false)
    }
    load()
    // Poll every 30s for live updates
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [id])

  if (loading) {
    return (
      <Layout hideSidebar>
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Loading fixture...</div>
      </Layout>
    )
  }

  if (!fixture) {
    return (
      <Layout hideSidebar>
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>Fixture not found</div>
      </Layout>
    )
  }

  // Group markets
  const groupedMarkets: Record<string, Market[]> = {}
  Object.keys(MARKET_GROUPS).forEach(g => { groupedMarkets[g] = [] })
  groupedMarkets['Other'] = []

  fixture.markets?.forEach(m => {
    let placed = false
    for (const [group, types] of Object.entries(MARKET_GROUPS)) {
      if (types.some(t => m.type?.includes(t) || m.name?.toLowerCase().includes(t.replace(/_/g, ' ')))) {
        groupedMarkets[group].push(m)
        placed = true
        break
      }
    }
    if (!placed) groupedMarkets['Other'].push(m)
  })

  const activeMarkets = groupedMarkets[activeGroup] ?? []

  return (
    <Layout hideSidebar>
      <Head><title>{fixture.homeTeam?.name} vs {fixture.awayTeam?.name} — BetPro</title></Head>
      <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-height))' }}>
        {/* ── MAIN ── */}
        <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          {/* Match header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
            borderBottom: '1px solid var(--border)', padding: '20px 24px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, display: 'flex', gap: 6 }}>
              <span>{fixture.sport?.name ?? 'Cricket'}</span>
              <span>›</span>
              <span>{fixture.competition?.name ?? 'IPL 2026'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏟️</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                  {fixture.homeTeam?.name}
                </div>
              </div>

              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                {fixture.isLive && fixture.liveScore ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                      <span className="live-dot" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--live-red)', letterSpacing: 1 }}>
                        LIVE {fixture.liveScore.minute ? `${fixture.liveScore.minute}'` : ''}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 52,
                      color: 'var(--text-primary)', lineHeight: 1,
                    }}>
                      {fixture.liveScore.homeScore} — {fixture.liveScore.awayScore}
                    </div>
                    {fixture.liveScore.period && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{fixture.liveScore.period}</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--text-muted)', letterSpacing: 4 }}>VS</div>
                    <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 8 }}>
                      {fixture.startsAt ? new Date(fixture.startsAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🏟️</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
                  {fixture.awayTeam?.name}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Markets', value: fixture.markets?.length ?? 0 },
                { label: 'Sport', value: fixture.sport?.name ?? 'Cricket' },
                { label: 'Competition', value: fixture.competition?.name ?? 'IPL' },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 6, padding: '8px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase' as const }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Market group tabs */}
          <div style={{
            display: 'flex', gap: 0, overflowX: 'auto',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 10,
          }}>
            {Object.entries(groupedMarkets).filter(([, m]) => m.length > 0).map(([group, markets]) => (
              <button key={group} onClick={() => setActiveGroup(group)} style={{
                padding: '12px 18px', background: 'none', border: 'none',
                borderBottom: activeGroup === group ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeGroup === group ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                letterSpacing: 0.4, whiteSpace: 'nowrap', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {group}
                <span style={{
                  background: 'var(--bg-elevated)', borderRadius: 10,
                  fontSize: 10, padding: '1px 5px', color: 'var(--text-muted)',
                }}>{markets.length}</span>
              </button>
            ))}
          </div>

          {/* Markets */}
          <div style={{ padding: '16px' }}>
            {activeMarkets.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
                No markets available for this category
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeMarkets.map(m => (
                  <MarketCard key={m.id} market={m} fixtureId={fixture.id} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── BETSLIP ── */}
        <Betslip />
      </div>
    </Layout>
  )
}

function MarketCard({ market: m, fixtureId }: { market: Market; fixtureId: string }) {
  const [collapsed, setCollapsed] = useState(false)
  const showLine = m.outcomes.some(o => o.line !== undefined)

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', overflow: 'hidden',
    }}>
      <button onClick={() => setCollapsed(!collapsed)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer',
      }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{m.name}</span>
        <span style={{
          color: 'var(--text-muted)', fontSize: 10,
          transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
          transition: '0.2s',
        }}>▼</span>
      </button>
      {!collapsed && (
        <div style={{ padding: '0 14px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {m.outcomes.map(o => (
            <OddsButton
              key={o.id}
              fixtureId={fixtureId}
              marketId={m.id}
              outcomeId={o.id}
              label={showLine && o.line !== undefined ? `${o.name} (${o.line > 0 ? '+' : ''}${o.line})` : o.name}
              odds={o.odds}
              suspended={o.suspended}
            />
          ))}
        </div>
      )}
    </div>
  )
}
