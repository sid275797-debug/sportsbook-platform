import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { cricketApi, fixturesApi } from '../../lib/api'

interface CricketMatch {
  id: string
  homeTeam: { name: string; shortName?: string }
  awayTeam: { name: string; shortName?: string }
  competition?: { name: string }
  startsAt: string
  isLive?: boolean
  status?: string
  liveScore?: { homeScore: number; awayScore: number; minute?: number; period?: string }
  score?: string
}

export default function CricketLivePage() {
  const [matches, setMatches] = useState<CricketMatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await cricketApi.liveScores()
        const d = res.data?.data ?? res.data ?? []
        setMatches(Array.isArray(d) ? d : [])
      } catch {
        // Fallback to generic live fixtures filtered to cricket
        try {
          const res = await fixturesApi.live()
          const d = res.data?.data ?? res.data ?? []
          setMatches((Array.isArray(d) ? d : []).filter((f: any) => f.sport?.slug === 'cricket'))
        } catch {}
      }
      setLoading(false)
    }
    load()
    const t = setInterval(load, 15_000)
    return () => clearInterval(t)
  }, [])

  return (
    <Layout>
      <Head><title>Live Cricket Scores — BetPro</title></Head>
      <div style={{ padding: '24px' }} className="fade-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span className="live-dot" />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24 }}>
            🏏 LIVE CRICKET
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Loading live scores...</div>
        ) : matches.length === 0 ? (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏏</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              No Live Matches Right Now
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Check the IPL schedule for upcoming matches
            </div>
            <Link href="/cricket/ipl" style={{
              background: 'var(--accent)', color: '#000', padding: '10px 20px',
              borderRadius: 'var(--radius)', fontWeight: 700, fontSize: 13,
            }}>VIEW IPL SCHEDULE</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matches.map(m => (
              <Link key={m.id} href={`/fixture/${m.id}`} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {m.homeTeam?.name} vs {m.awayTeam?.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {m.competition?.name ?? 'Cricket'} • {m.status ?? (m.isLive ? 'In Progress' : 'Upcoming')}
                  </div>
                  {m.score && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent)', marginTop: 6 }}>
                      {m.score}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {m.isLive && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="live-dot" />
                      <span style={{ color: 'var(--live-red)', fontWeight: 700, fontSize: 11 }}>LIVE</span>
                    </div>
                  )}
                  <span style={{
                    background: 'var(--accent)', color: '#000', borderRadius: 4,
                    fontSize: 11, fontWeight: 700, padding: '4px 10px',
                  }}>BET →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
