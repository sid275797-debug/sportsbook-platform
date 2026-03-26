import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import Betslip from '../components/Betslip'
import OddsButton from '../components/OddsButton'
import { fixturesApi } from '../lib/api'

export default function SportsBook() {
  const router = useRouter()
  const { sport, live } = router.query
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        let res
        if (live === 'true') {
          res = await fixturesApi.live()
        } else {
          res = await fixturesApi.upcoming({ sport: sport as string, limit: 30 })
        }
        const d = res.data?.data ?? res.data ?? []
        let list = Array.isArray(d) ? d : []
        if (sport && live !== 'true') {
          list = list.filter((f: any) => f.sport?.slug === sport)
        }
        setFixtures(list)
      } catch {}
      setLoading(false)
    }
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [sport, live])

  const title = live === 'true' ? 'LIVE BETTING' : sport
    ? `${(sport as string).charAt(0).toUpperCase() + (sport as string).slice(1)} Betting`
    : 'SPORTSBOOK'

  return (
    <Layout hideSidebar>
      <Head><title>{title} — BetPro</title></Head>
      <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-height))' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            {live === 'true' && <span className="live-dot" />}
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>
              {title}
            </span>
            {fixtures.length > 0 && (
              <span style={{
                background: 'var(--bg-elevated)', borderRadius: 10,
                fontSize: 12, fontWeight: 700, padding: '2px 8px', color: 'var(--text-muted)',
              }}>{fixtures.length}</span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Loading...</div>
          ) : fixtures.length === 0 ? (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏟️</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                No {live === 'true' ? 'live' : 'upcoming'} fixtures
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                Check back soon for more matches
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {fixtures.map((f: any) => {
                const mainMarket = f.markets?.[0]
                return (
                  <div key={f.id} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '12px 16px',
                    display: 'flex', alignItems: 'center', gap: 16,
                  }}>
                    <Link href={`/fixture/${f.id}`} style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>
                        {f.homeTeam?.name} vs {f.awayTeam?.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {f.competition?.name}
                        {f.isLive && (
                          <span style={{ color: 'var(--live-red)', fontWeight: 700, marginLeft: 8 }}>
                            LIVE {f.liveScore ? `${f.liveScore.homeScore}–${f.liveScore.awayScore}` : ''}
                          </span>
                        )}
                        {!f.isLive && f.startsAt && (
                          <span style={{ marginLeft: 8 }}>
                            {new Date(f.startsAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </Link>
                    {mainMarket && (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {mainMarket.outcomes?.slice(0, 3).map((o: any) => (
                          <OddsButton key={o.id}
                            fixtureId={f.id} marketId={mainMarket.id} outcomeId={o.id}
                            label={o.name} odds={o.odds} suspended={o.suspended}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <Betslip />
      </div>
    </Layout>
  )
}
