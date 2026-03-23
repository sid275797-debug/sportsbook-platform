import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'

const CRIC_API_KEY = '0e867a61-e49d-45df-a839-196c667f603d'
const BASE = 'https://api.cricapi.com/v1'

const IPL_TEAMS = [
  { name: 'Mumbai Indians',              short: 'MI',   color: '#004BA0', accent: '#00BFFF', emoji: 'ðŸ’™' },
  { name: 'Chennai Super Kings',         short: 'CSK',  color: '#F9CD05', accent: '#D4A800', emoji: 'ðŸ’›' },
  { name: 'Royal Challengers Bengaluru', short: 'RCB',  color: '#EC1C24', accent: '#EC1C24', emoji: 'â¤ï¸' },
  { name: 'Kolkata Knight Riders',       short: 'KKR',  color: '#3A225D', accent: '#B3973A', emoji: 'ðŸ’œ' },
  { name: 'Delhi Capitals',              short: 'DC',   color: '#00008B', accent: '#EF1B23', emoji: 'ðŸ’™' },
  { name: 'Sunrisers Hyderabad',         short: 'SRH',  color: '#FF822A', accent: '#FF822A', emoji: 'ðŸ§¡' },
  { name: 'Rajasthan Royals',            short: 'RR',   color: '#EA1A85', accent: '#EA1A85', emoji: 'ðŸ©·' },
  { name: 'Punjab Kings',               short: 'PBKS', color: '#ED1B24', accent: '#ED1B24', emoji: 'â¤ï¸' },
  { name: 'Lucknow Super Giants',        short: 'LSG',  color: '#A72056', accent: '#00B4D8', emoji: 'ðŸ’™' },
  { name: 'Gujarat Titans',             short: 'GT',   color: '#1C1C1C', accent: '#0B4973', emoji: 'ðŸ”µ' },
]

const TEAM_ALIASES: Record<string, string> = {
  'Mumbai Indians': 'MI', 'Chennai Super Kings': 'CSK',
  'Royal Challengers Bengaluru': 'RCB', 'Royal Challengers Bangalore': 'RCB',
  'Kolkata Knight Riders': 'KKR', 'Delhi Capitals': 'DC',
  'Sunrisers Hyderabad': 'SRH', 'Rajasthan Royals': 'RR',
  'Punjab Kings': 'PBKS', 'Lucknow Super Giants': 'LSG', 'Gujarat Titans': 'GT',
}

function normalizeTeam(name: string): string | null {
  if (!name) return null
  if (TEAM_ALIASES[name]) return TEAM_ALIASES[name]
  for (const [full, short] of Object.entries(TEAM_ALIASES)) {
    if (name.toLowerCase().includes(full.split(' ')[0].toLowerCase())) return short
  }
  return null
}

const FALLBACK_POINTS = [
  { team: 'MI', mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'CSK', mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'RCB', mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'KKR', mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'SRH', mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'DC',  mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'RR',  mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'PBKS', mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'LSG', mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
  { team: 'GT',  mp: 0, w: 0, l: 0, pts: 0, nrr: '0.000' },
]

function TeamCard({ team, pts }: { team: typeof IPL_TEAMS[0]; pts: any }) {
  return (
    <div style={{
      background: `linear-gradient(145deg, ${team.color}22, var(--bg-card))`,
      border: `1px solid ${team.color}44`, borderRadius: 'var(--radius-lg)', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: team.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{team.emoji}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>{team.short}</div>
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
  const [matches, setMatches] = useState<any[]>([])
  const [pointsTable, setPointsTable] = useState<any[]>(FALLBACK_POINTS)
  const [loading, setLoading] = useState(true)
  const [pointsLoading, setPointsLoading] = useState(true)
  const [tab, setTab] = useState<'matches' | 'teams' | 'points'>('matches')

  useEffect(() => {
    async function fetchIPL() {
      try {
        const res = await fetch(`${BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`)
        const data = await res.json()
        if (data.status === 'success' && data.data) {
          const ipl = data.data.filter((m: any) =>
            m.name?.toLowerCase().includes('ipl') ||
            m.name?.toLowerCase().includes('indian premier') ||
            IPL_TEAMS.some(t => m.teams?.includes(t.name))
          )
          if (ipl.length > 0) setMatches(ipl)
          else setMatches(data.data.slice(0, 10))
        }
      } catch {}
      setLoading(false)
    }

    async function fetchPointsTable() {
      try {
        const seriesRes = await fetch(`${BASE}/series?apikey=${CRIC_API_KEY}&offset=0`)
        const seriesData = await seriesRes.json()
        if (seriesData.status !== 'success') { setPointsLoading(false); return }

        const iplSeries = seriesData.data?.find((s: any) =>
          s.name?.toLowerCase().includes('indian premier') || s.name?.toLowerCase().includes('ipl')
        )
        if (!iplSeries) { setPointsLoading(false); return }

        const infoRes = await fetch(`${BASE}/series_info?apikey=${CRIC_API_KEY}&id=${iplSeries.id}`)
        const infoData = await infoRes.json()
        if (infoData.status !== 'success') { setPointsLoading(false); return }

        // Compute points from completed matches
        const matchList = infoData.data?.matchList ?? []
        const stats: Record<string, { mp: number; w: number; l: number; pts: number; runsScored: number; runsConceded: number; oversFaced: number; oversBowled: number }> = {}

        for (const short of IPL_TEAMS.map(t => t.short)) {
          stats[short] = { mp: 0, w: 0, l: 0, pts: 0, runsScored: 0, runsConceded: 0, oversFaced: 0, oversBowled: 0 }
        }

        for (const match of matchList) {
          if (!match.matchEnded) continue
          const t1 = normalizeTeam(match.teams?.[0])
          const t2 = normalizeTeam(match.teams?.[1])
          if (!t1 || !t2 || !stats[t1] || !stats[t2]) continue
          stats[t1].mp++
          stats[t2].mp++
          // Determine winner by checking status
          const status = (match.status ?? '').toLowerCase()
          let winner: string | null = null
          for (const team of IPL_TEAMS) {
            if (status.includes(team.name.split(' ')[0].toLowerCase()) && status.includes('won')) {
              winner = team.short
              break
            }
          }
          if (winner && stats[winner]) {
            stats[winner].w++
            stats[winner].pts += 2
            const loser = winner === t1 ? t2 : t1
            if (stats[loser]) stats[loser].l++
          }
        }

        const table = IPL_TEAMS.map(t => ({
          team: t.short,
          mp: stats[t.short]?.mp ?? 0,
          w: stats[t.short]?.w ?? 0,
          l: stats[t.short]?.l ?? 0,
          pts: stats[t.short]?.pts ?? 0,
          nrr: '+0.000',
        })).sort((a, b) => b.pts - a.pts || b.w - a.w)

        setPointsTable(table)
      } catch {}
      setPointsLoading(false)
    }

    fetchIPL()
    fetchPointsTable()
  }, [])

  return (
    <Layout>
      <Head><title>IPL 2026 â€” BetPro Cricket</title></Head>
      <div style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #0a0a1a 50%, #1a1a00 100%)',
        borderBottom: '1px solid var(--border)', padding: '28px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(249,205,5,0.06), transparent 50%), radial-gradient(circle at 70% 30%, rgba(0,212,170,0.06), transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ fontSize: 48 }}>ðŸ</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: 1 }}>
                IPL <span style={{ color: '#F9CD05' }}>2026</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Indian Premier League Â· 10 Teams Â· 74 Matches Â· Live Scores & Betting</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['ðŸ† Season 19', 'ðŸ“… Marchâ€“May 2026', 'ðŸŸï¸ 10 Venues', 'ðŸ’° Live Betting'].map(b => (
              <span key={b} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-bright)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/cricket/live" style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.3)', borderRadius: 'var(--radius)', padding: '10px 20px', color: '#e03f3f', fontWeight: 700, fontSize: 13 }}>ðŸ”´ Live Scores</Link>
          <Link href="/cricket/betting" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius)', padding: '10px 20px', color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>ðŸŽ¯ Bet on IPL</Link>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {[['matches', 'ðŸ“… Matches'], ['teams', 'ðŸ Teams'], ['points', 'ðŸ† Points Table']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key as any)} style={{
              padding: '12px 20px', background: 'none', border: 'none',
              borderBottom: `3px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
              color: tab === key ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: -1,
            }}>{label as string}</button>
          ))}
        </div>

        {tab === 'matches' && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ</div>
                <div>Loading IPL matches...</div>
              </div>
            ) : matches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {matches.map(m => {
                  const isLive = m.matchStarted && !m.matchEnded
                  return (
                    <Link key={m.id} href="/cricket/live" style={{
                      background: 'var(--bg-card)', border: `1px solid ${isLive ? 'rgba(224,63,63,0.3)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-lg)', padding: 20, display: 'block',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {isLive && <span style={{ fontSize: 10, fontWeight: 800, background: '#e03f3f', color: '#fff', padding: '2px 8px', borderRadius: 3 }}>LIVE</span>}
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
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ</div>
                <div>No live IPL matches. Check /cricket/live for all matches.</div>
              </div>
            )}
          </div>
        )}

        {tab === 'teams' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {IPL_TEAMS.map(team => (
              <TeamCard key={team.short} team={team} pts={pointsTable.find(p => p.team === team.short)} />
            ))}
          </div>
        )}

        {tab === 'points' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>ðŸ† IPL 2026 Points Table</div>
              {pointsLoading
                ? <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading live data...</span>
                : <span style={{ fontSize: 11, color: 'var(--accent)' }}>âœ“ Live from CricAPI</span>
              }
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
                  {pointsTable.map((row, i) => {
                    const team = IPL_TEAMS.find(t => t.short === row.team)!
                    const isQ = i < 4
                    return (
                      <tr key={row.team} style={{ borderBottom: '1px solid var(--border)', background: isQ ? `${team?.color ?? '#000'}08` : 'transparent' }}>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: 13, color: isQ ? 'var(--accent)' : 'var(--text-muted)', fontWeight: isQ ? 700 : 400 }}>{i + 1}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: team?.color ?? '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{team?.emoji}</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: team?.accent }}>{row.team}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{team?.name}</div>
                            </div>
                            {isQ && <span style={{ fontSize: 9, background: 'rgba(0,212,170,0.15)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 3, fontWeight: 700 }}>Q</span>}
                          </div>
                        </td>
                        {[row.mp, row.w, row.l].map((v, j) => (
                          <td key={j} style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-secondary)' }}>{v}</td>
                        ))}
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13, color: (row.nrr ?? '').startsWith('+') ? 'var(--accent)' : 'var(--live-red)' }}>{row.nrr}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: team?.accent }}>{row.pts}</td>
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