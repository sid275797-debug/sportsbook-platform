import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'
import Betslip from '../../components/Betslip'
import OddsButton from '../../components/OddsButton'
import { cricketApi } from '../../lib/api'

export default function CricketBettingPage() {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await cricketApi.iplFixtures()
        const d = res.data?.data ?? res.data ?? []
        setFixtures(Array.isArray(d) ? d : [])
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  return (
    <Layout hideSidebar>
      <Head><title>Cricket Betting — BetPro</title></Head>
      <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-height))' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, marginBottom: 20 }}>
            🏏 CRICKET BETTING
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Loading matches...</div>
          ) : fixtures.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
              No cricket fixtures with betting markets available
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fixtures.map(f => (
                <div key={f.id} style={{
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <Link href={`/fixture/${f.id}`} style={{ fontWeight: 700, fontSize: 15 }}>
                        {f.homeTeam?.name} vs {f.awayTeam?.name}
                      </Link>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                        {f.startsAt && new Date(f.startsAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {f.isLive && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span className="live-dot" />
                        <span style={{ color: 'var(--live-red)', fontWeight: 700, fontSize: 11 }}>LIVE</span>
                      </div>
                    )}
                  </div>

                  {f.markets?.slice(0, 2).map((m: any) => (
                    <div key={m.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                        {m.name}
                      </div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {m.outcomes?.map((o: any) => (
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

                  {(f.markets?.length ?? 0) > 2 && (
                    <Link href={`/fixture/${f.id}`} style={{
                      fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginTop: 8, display: 'inline-block',
                    }}>
                      +{f.markets.length - 2} more markets →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <Betslip />
      </div>
    </Layout>
  )
}
