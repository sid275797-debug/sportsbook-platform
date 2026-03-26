import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { cricketApi } from '../../lib/api'

const IPL_TEAMS: Record<string, { color: string; accent: string; emoji: string }> = {
  MI:   { color: '#004BA0', accent: '#00BFFF', emoji: '💙' },
  CSK:  { color: '#F9CD05', accent: '#F9CD05', emoji: '💛' },
  RCB:  { color: '#EC1C24', accent: '#EC1C24', emoji: '❤️' },
  KKR:  { color: '#3A225D', accent: '#B3973A', emoji: '💜' },
  DC:   { color: '#00008B', accent: '#EF1B23', emoji: '💙' },
  SRH:  { color: '#FF822A', accent: '#FF822A', emoji: '🧡' },
  RR:   { color: '#EA1A85', accent: '#EA1A85', emoji: '🩷' },
  PBKS: { color: '#ED1B24', accent: '#ED1B24', emoji: '❤️' },
  LSG:  { color: '#A72056', accent: '#00B4D8', emoji: '💙' },
  GT:   { color: '#1C1C1C', accent: '#0B4973', emoji: '🔵' },
}

interface IPLFixture {
  id: string
  homeTeam: { name: string; shortName?: string }
  awayTeam: { name: string; shortName?: string }
  startsAt: string
  venue?: string
  status?: string
  isLive?: boolean
  liveScore?: any
  markets?: any[]
}

interface PointsEntry {
  team: string
  mp: number
  w: number
  l: number
  nrr: string
  pts: number
}

export default function IPLPage() {
  const [matches, setMatches] = useState<IPLFixture[]>([])
  const [pointsTable, setPointsTable] = useState<PointsEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('matches')

  useEffect(() => {
    async function fetchIPL() {
      try {
        const [scheduleRes, pointsRes] = await Promise.allSettled([
          cricketApi.iplSchedule(),
          cricketApi.iplPointsTable(),
        ])
        if (scheduleRes.status === 'fulfilled') {
          const d = scheduleRes.value.data?.data ?? scheduleRes.value.data ?? []
          setMatches(Array.isArray(d) ? d : [])
        }
        if (pointsRes.status === 'fulfilled') {
          const d = pointsRes.value.data?.data ?? pointsRes.value.data ?? []
          setPointsTable(Array.isArray(d) ? d : [])
        }
      } catch {}

      // Fallback: try iplFixtures if schedule was empty
      if (matches.length === 0) {
        try {
          const res = await cricketApi.iplFixtures()
          const d = res.data?.data ?? res.data ?? []
          setMatches(Array.isArray(d) ? d : [])
        } catch {}
      }
      setLoading(false)
    }
    fetchIPL()
  }, [])

  return (
    <Layout>
      <Head><title>IPL 2026 — BetPro Cricket</title></Head>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #0a0a1a 50%, #1a1a00 100%)',
        borderBottom: '1px solid var(--border)', padding: '28px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 48 }}>🏏</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36 }}>
              IPL <span style={{ color: '#F9CD05' }}>2026</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Indian Premier League • Live Scores & Betting
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {[
            ['matches', '📅 Matches'],
            ['teams', '🏏 Teams'],
            ['points', '🏆 Points Table'],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding: '12px 20px', background: 'none', border: 'none',
              borderBottom: `3px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
              color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>Loading IPL data...</div>
        ) : (
          <>
            {/* MATCHES TAB */}
            {tab === 'matches' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                    No IPL matches found
                  </div>
                ) : (
                  matches.map(m => {
                    const homeShort = m.homeTeam?.shortName ?? m.homeTeam?.name?.slice(0, 3)?.toUpperCase()
                    const awayShort = m.awayTeam?.shortName ?? m.awayTeam?.name?.slice(0, 3)?.toUpperCase()
                    const homeInfo = IPL_TEAMS[homeShort ?? ''] ?? { color: 'var(--accent)', emoji: '🏏' }
                    const awayInfo = IPL_TEAMS[awayShort ?? ''] ?? { color: 'var(--accent-2)', emoji: '🏏' }

                    return (
                      <Link key={m.id} href={`/fixture/${m.id}`} style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', padding: '16px 20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        transition: 'background 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                          <span style={{ fontSize: 24 }}>{homeInfo.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15 }}>
                              {m.homeTeam?.name} <span style={{ color: 'var(--text-muted)' }}>vs</span> {m.awayTeam?.name}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                              {m.venue && <span>{m.venue} • </span>}
                              {m.startsAt && new Date(m.startsAt).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {m.isLive && (
                            <span style={{
                              background: 'var(--live-red)', color: '#fff', borderRadius: 10,
                              fontSize: 10, fontWeight: 700, padding: '2px 8px',
                            }}>LIVE</span>
                          )}
                          {m.markets && m.markets.length > 0 && (
                            <span style={{
                              background: 'var(--accent)', color: '#000', borderRadius: 4,
                              fontSize: 11, fontWeight: 700, padding: '4px 10px',
                            }}>BET →</span>
                          )}
                        </div>
                      </Link>
                    )
                  })
                )}
              </div>
            )}

            {/* TEAMS TAB */}
            {tab === 'teams' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {Object.entries(IPL_TEAMS).map(([short, info]) => (
                  <div key={short} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '20px', textAlign: 'center',
                    borderTop: `3px solid ${info.color}`,
                  }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>{info.emoji}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>{short}</div>
                  </div>
                ))}
              </div>
            )}

            {/* POINTS TABLE TAB */}
            {tab === 'points' && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                      {['#', 'Team', 'MP', 'W', 'L', 'NRR', 'PTS'].map(h => (
                        <th key={h} style={{
                          padding: '12px 16px', textAlign: h === 'Team' ? 'left' : 'center',
                          fontSize: 11, fontWeight: 700, letterSpacing: 0.8,
                          color: 'var(--text-muted)', textTransform: 'uppercase' as const,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pointsTable.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                        No points table data available
                      </td></tr>
                    ) : (
                      pointsTable.map((row, i) => {
                        const teamInfo = IPL_TEAMS[row.team] ?? {}
                        return (
                          <tr key={row.team} style={{
                            borderBottom: '1px solid var(--border)',
                            background: i < 4 ? 'rgba(0,212,170,0.04)' : 'transparent',
                          }}>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{i + 1}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14 }}>
                              <span style={{ marginRight: 8 }}>{teamInfo.emoji ?? '🏏'}</span>
                              {row.team}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.mp}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)' }}>{row.w}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--live-red)' }}>{row.l}</td>
                            <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{row.nrr}</td>
                            <td style={{
                              padding: '12px 16px', textAlign: 'center',
                              fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--accent)',
                            }}>{row.pts}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
