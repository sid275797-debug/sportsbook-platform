import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'

const CRIC_API_KEY = '0e867a61-e49d-45df-a839-196c667f603d'
const BASE = 'https://api.cricapi.com/v1'

// IPL 2026 Series ID — update this after fetching from /series endpoint
const IPL_SERIES_SEARCH = 'Indian Premier League'

const IPL_TEAMS = [
  { name: 'Mumbai Indians',            short: 'MI',  color: '#004BA0', accent: '#00BFFF', emoji: '💙' },
  { name: 'Chennai Super Kings',       short: 'CSK', color: '#F9CD05', accent: '#F9CD05', emoji: '💛' },
  { name: 'Royal Challengers Bengaluru', short: 'RCB', color: '#EC1C24', accent: '#EC1C24', emoji: '❤️' },
  { name: 'Kolkata Knight Riders',     short: 'KKR', color: '#3A225D', accent: '#B3973A', emoji: '💜' },
  { name: 'Delhi Capitals',            short: 'DC',  color: '#00008B', accent: '#EF1B23', emoji: '💙' },
  { name: 'Sunrisers Hyderabad',       short: 'SRH', color: '#FF822A', accent: '#FF822A', emoji: '🧡' },
  { name: 'Rajasthan Royals',          short: 'RR',  color: '#EA1A85', accent: '#EA1A85', emoji: '🩷' },
  { name: 'Punjab Kings',              short: 'PBKS',color: '#ED1B24', accent: '#ED1B24', emoji: '❤️' },
  { name: 'Lucknow Super Giants',      short: 'LSG', color: '#A72056', accent: '#00B4D8', emoji: '💙' },
  { name: 'Gujarat Titans',            short: 'GT',  color: '#1C1C1C', accent: '#0B4973', emoji: '🔵' },
]

// Simulated points table (will be replaced by live data when available)
const POINTS_TABLE = [
  { team: 'MI',  mp: 8, w: 6, l: 2, nrr: '+1.234', pts: 12 },
  { team: 'CSK', mp: 8, w: 5, l: 3, nrr: '+0.876', pts: 10 },
  { team: 'RCB', mp: 8, w: 5, l: 3, nrr: '+0.654', pts: 10 },
  { team: 'KKR', mp: 8, w: 4, l: 4, nrr: '+0.321', pts: 8  },
  { team: 'SRH', mp: 8, w: 4, l: 4, nrr: '-0.123', pts: 8  },
  { team: 'DC',  mp: 8, w: 4, l: 4, nrr: '-0.234', pts: 8  },
  { team: 'RR',  mp: 8, w: 3, l: 5, nrr: '-0.456', pts: 6  },
  { team: 'PBKS',mp: 8, w: 3, l: 5, nrr: '-0.567', pts: 6  },
  { team: 'LSG', mp: 8, w: 2, l: 6, nrr: '-0.789', pts: 4  },
  { team: 'GT',  mp: 8, w: 2, l: 6, nrr: '-0.987', pts: 4  },
]

interface Match {
  id: string
  name: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  score?: any[]
  matchStarted?: boolean
  matchEnded?: boolean
  matchType?: string
}

function TeamCard({ team }: { team: typeof IPL_TEAMS[0] }) {
  const pts = POINTS_TABLE.find(p => p.team === team.short)
  return (
    <div style={{
      background: `linear-gradient(145deg, ${team.color}22, var(--bg-card))`,
      border: `1px solid ${team.color}44`,
      borderRadius: 'var(--radius-lg)', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: team.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>{team.emoji}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>{team.short}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{team.name}</div>
        </div>
      </div>
      {pts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 4 }}>
          {[['MP', pts.mp], ['W', pts.w], ['L', pts.l], ['PTS', pts.pts]].map(([label, val]) => (
            <div key={label as string} style={{ textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 6, padding: '4px 0' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: label === 'PTS' ? team.accent : 'var(--text-primary)' }}>{val}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 0.5 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function IPLPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'matches' | 'teams' | 'points'>('matches')

  useEffect(() => {
    async function fetchIPL() {
      try {
        // First search for IPL series
        const seriesRes = await fetch(`${BASE}/series?apikey=${CRIC_API_KEY}&offset=0`)
        const seriesData = await seriesRes.json()

        if (seriesData.status === 'success') {
          const iplSeries = seriesData.data?.find((s: any) =>
            s.name?.toLowerCase().includes('indian premier') ||
            s.name?.toLowerCase().includes('ipl')
          )

          if (iplSeries) {
            // Fetch matches for IPL series
            const matchRes = await fetch(`${BASE}/series_info?apikey=${CRIC_API_KEY}&id=${iplSeries.id}`)
            const matchData = await matchRes.json()
            if (matchData.status === 'success') {
              setMatches(matchData.data?.matchList ?? [])
            }
          }
        }

        // Fallback: fetch all current matches and filter IPL
        const currentRes = await fetch(`${BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`)
        const currentData = await currentRes.json()
        if (currentData.status === 'success' && currentData.data) {
          const iplMatches = currentData.data.filter((m: any) =>
            m.name?.toLowerCase().includes('ipl') ||
            m.name?.toLowerCase().includes('indian premier') ||
            IPL_TEAMS.some(t => m.teams?.includes(t.name))
          )
          if (iplMatches.length > 0) setMatches(iplMatches)
        }
      } catch {}
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
        borderBottom: '1px solid var(--border)', padding: '28px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(249,205,5,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(0,212,170,0.06) 0%, transparent 50%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ fontSize: 48 }}>🏏</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: 1 }}>
                IPL <span style={{ color: '#F9CD05' }}>2026</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Indian Premier League · 10 Teams · 74 Matches · Live Scores & Betting
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['🏆 Season 19', '📅 March–May 2026', '🏟️ 10 Venues', '💰 Live Betting'].map(b => (
              <span key={b} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-bright)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Quick links */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/cricket/live" style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.3)', borderRadius: 'var(--radius)', padding: '10px 20px', color: '#e03f3f', fontWeight: 700, fontSize: 13 }}>
            🔴 Live Scores
          </Link>
          <Link href="/cricket/live" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius)', padding: '10px 20px', color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>
            🎯 Bet on IPL
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {[['matches', '📅 Matches'], ['teams', '🏏 Teams'], ['points', '🏆 Points Table']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as any)} style={{
              padding: '12px 20px', background: 'none', border: 'none',
              borderBottom: `3px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
              color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
              marginBottom: -1,
            }}>{label as string}</button>
          ))}
        </div>

        {/* Matches Tab */}
        {tab === 'matches' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏏</div>
                <div>Loading IPL matches...</div>
              </div>
            ) : matches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {matches.map(m => {
                  const isLive = m.matchStarted && !m.matchEnded
                  const team1 = m.teams?.[0]
                  const team2 = m.teams?.[1]
                  const t1 = IPL_TEAMS.find(t => team1?.includes(t.short) || team1?.includes(t.name.split(' ')[0]))
                  const t2 = IPL_TEAMS.find(t => team2?.includes(t.short) || team2?.includes(t.name.split(' ')[0]))
                  return (
                    <Link key={m.id} href="/cricket/live" style={{
                      background: 'var(--bg-card)', border: `1px solid ${isLive ? 'rgba(224,63,63,0.3)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)', padding: 20, display: 'block', transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          {isLive && <span style={{ fontSize: 10, fontWeight: 800, background: '#e03f3f', color: '#fff', padding: '2px 8px', borderRadius: 3, letterSpacing: 0.5 }}>LIVE</span>}
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>{m.name}</div>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(m.dateTimeGMT).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      {m.score && m.score.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {m.score.map((s: any, i: number) => (
                            <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '6px 12px', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                              <span style={{ color: 'var(--text-muted)', marginRight: 6 }}>{s.inning?.split(' Inning')[0]}</span>
                              <span style={{ fontWeight: 800 }}>{s.r}/{s.w}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({s.o} ov)</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ marginTop: 8, fontSize: 12, color: isLive ? '#f0a500' : m.matchEnded ? '#22c55e' : 'var(--text-muted)', fontWeight: isLive ? 600 : 400 }}>
                        {m.status}
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              // Demo schedule when no live IPL matches
              <div>
                <div style={{ background: 'rgba(249,205,5,0.06)', border: '1px solid rgba(249,205,5,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#F9CD05' }}>
                  ℹ️ No live IPL matches currently. Showing upcoming schedule.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { t1: 'MI', t2: 'CSK', venue: 'Wankhede Stadium, Mumbai', date: 'Today, 7:30 PM', live: true },
                    { t1: 'RCB', t2: 'KKR', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'Tomorrow, 3:30 PM', live: false },
                    { t1: 'SRH', t2: 'DC', venue: 'Rajiv Gandhi IS, Hyderabad', date: 'Tomorrow, 7:30 PM', live: false },
                    { t1: 'RR', t2: 'PBKS', venue: 'Sawai Mansingh Stadium, Jaipur', date: 'In 2 days, 7:30 PM', live: false },
                    { t1: 'GT', t2: 'LSG', venue: 'Narendra Modi Stadium, Ahmedabad', date: 'In 3 days, 7:30 PM', live: false },
                  ].map((m, i) => {
                    const t1 = IPL_TEAMS.find(t => t.short === m.t1)!
                    const t2 = IPL_TEAMS.find(t => t.short === m.t2)!
                    return (
                      <div key={i} style={{ background: 'var(--bg-card)', border: `1px solid ${m.live ? 'rgba(224,63,63,0.3)' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          {m.live ? <span style={{ fontSize: 10, fontWeight: 800, background: '#e03f3f', color: '#fff', padding: '2px 8px', borderRadius: 3 }}>LIVE</span> : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>UPCOMING</span>}
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: t1.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t1.emoji}</div>
                            <div>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: t1.accent }}>{t1.short}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t1.name}</div>
                            </div>
                          </div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: 'var(--text-muted)' }}>VS</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: 'row-reverse' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: t2.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t2.emoji}</div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: t2.accent }}>{t2.short}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t2.name}</div>
                            </div>
                          </div>
                        </div>
                        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>📍 {m.venue}</div>
                        {/* Odds */}
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1, background: `${t1.color}22`, border: `1px solid ${t1.color}44`, borderRadius: 8, padding: '8px', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t1.short}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: t1.accent }}>1.85</div>
                          </div>
                          <div style={{ flex: 1, background: `${t2.color}22`, border: `1px solid ${t2.color}44`, borderRadius: 8, padding: '8px', textAlign: 'center', cursor: 'pointer' }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t2.short}</div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: t2.accent }}>2.00</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {tab === 'teams' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {IPL_TEAMS.map(team => <TeamCard key={team.short} team={team} />)}
          </div>
        )}

        {/* Points Table */}
        {tab === 'points' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
              🏆 IPL 2026 Points Table
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    {['#', 'Team', 'MP', 'W', 'L', 'NRR', 'PTS'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Team' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {POINTS_TABLE.map((row, i) => {
                    const team = IPL_TEAMS.find(t => t.short === row.team)!
                    const isQualified = i < 4
                    return (
                      <tr key={row.team} style={{ borderBottom: '1px solid var(--border)', background: isQualified ? `${team.color}08` : 'transparent' }}>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: isQualified ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isQualified ? 700 : 400 }}>{i + 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: team.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{team.emoji}</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: team.accent }}>{row.team}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{team.name}</div>
                            </div>
                            {isQualified && <span style={{ fontSize: 9, background: 'rgba(0,212,170,0.15)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 3, fontWeight: 700, letterSpacing: 0.5 }}>Q</span>}
                          </div>
                        </td>
                        {[row.mp, row.w, row.l].map((v, j) => (
                          <td key={j} style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)' }}>{v}</td>
                        ))}
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: row.nrr.startsWith('+') ? 'var(--accent)' : 'var(--live-red)' }}>{row.nrr}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: team.accent }}>{row.pts}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 16 }}>
              <span><span style={{ color: 'var(--accent)', fontWeight: 700 }}>Q</span> = Qualified for playoffs</span>
              <span>Top 4 advance to Qualifier 1 & Eliminator</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
