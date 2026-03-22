import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'

const CRIC_API_KEY = '0e867a61-e49d-45df-a839-196c667f603d'
const BASE = 'https://api.cricapi.com/v1'

interface Score {
  r?: number
  w?: number
  o?: number
  inning?: string
}

interface Match {
  id: string
  name: string
  status: string
  venue: string
  date: string
  dateTimeGMT: string
  teams: string[]
  teamInfo?: Array<{ name: string; shortname: string; img: string }>
  score?: Score[]
  series_id?: string
  matchType?: string
  matchStarted?: boolean
  matchEnded?: boolean
}

function getMatchStatus(match: Match): { label: string; color: string; pulse: boolean } {
  if (!match.matchStarted) return { label: 'UPCOMING', color: '#f0a500', pulse: false }
  if (match.matchEnded)    return { label: 'COMPLETED', color: 'var(--text-muted)', pulse: false }
  return { label: 'LIVE', color: '#e03f3f', pulse: true }
}

function formatScore(score?: Score[]): string {
  if (!score || score.length === 0) return 'Yet to bat'
  return score.map(s => {
    const inning = s.inning?.replace(' Inning 1', ' I1').replace(' Inning 2', ' I2') ?? ''
    return `${inning}: ${s.r ?? 0}/${s.w ?? 0} (${s.o ?? 0})`
  }).join(' | ')
}

function MatchCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const { label, color, pulse } = getMatchStatus(match)
  const team1 = match.teams?.[0] ?? 'TBD'
  const team2 = match.teams?.[1] ?? 'TBD'
  const t1Info = match.teamInfo?.find(t => t.name === team1)
  const t2Info = match.teamInfo?.find(t => t.name === team2)

  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 20, cursor: 'pointer',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
          {match.matchType?.toUpperCase()} • {match.name?.split(',')[0]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {pulse && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`, display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />}
          <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: 0.5 }}>{label}</span>
        </div>
      </div>

      {/* Teams */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {t1Info?.img && <img src={t1Info.img} alt={team1} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
              {t1Info?.shortname ?? team1.substring(0, 3).toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{team1}</div>
          </div>
        </div>

        <div style={{ padding: '6px 16px', background: 'var(--bg-elevated)', borderRadius: 20, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0, margin: '0 12px' }}>VS</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
              {t2Info?.shortname ?? team2.substring(0, 3).toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{team2}</div>
          </div>
          {t2Info?.img && <img src={t2Info.img} alt={team2} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />}
        </div>
      </div>

      {/* Score */}
      {match.score && match.score.length > 0 && (
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {match.score.map((s, i) => (
            <div key={i}>
              <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>{s.inning?.replace('Inning 1', 'Inn 1').replace('Inning 2', 'Inn 2')}</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.r ?? 0}/{s.w ?? 0}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({s.o ?? 0} ov)</span>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div style={{ fontSize: 12, color: match.matchEnded ? '#22c55e' : match.matchStarted ? '#f0a500' : 'var(--text-muted)', fontWeight: match.matchStarted ? 600 : 400 }}>
        {match.status}
      </div>

      {/* Venue & Date */}
      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>📍 {match.venue?.split(',')[0]}</span>
        <span>{new Date(match.dateTimeGMT).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      {/* Bet button */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, padding: '8px', textAlign: 'center',
          background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)',
          borderRadius: 'var(--radius)', fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          cursor: 'pointer',
        }}>BET NOW →</div>
      </div>
    </div>
  )
}

function MatchDetail({ match, onClose }: { match: Match; onClose: () => void }) {
  const [scorecard, setScorecard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchScorecard() {
      try {
        const res = await fetch(`${BASE}/match_scorecard?apikey=${CRIC_API_KEY}&id=${match.id}`)
        const data = await res.json()
        if (data.status === 'success') setScorecard(data.data)
      } catch {}
      setLoading(false)
    }
    fetchScorecard()
  }, [match.id])

  const { label, color } = getMatchStatus(match)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 1000, overflowY: 'auto', padding: '20px 16px',
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>{match.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{match.venue} • {match.matchType?.toUpperCase()}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 700 }}>✕ Close</button>
        </div>

        {/* Status */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
            <span style={{ fontWeight: 800, color, fontSize: 13 }}>{label}</span>
          </div>
          <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 600 }}>{match.status}</div>

          {/* Live Scores */}
          {match.score && match.score.length > 0 && (
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {match.score.map((s, i) => (
                <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{s.inning}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)' }}>
                    {s.r ?? 0}<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>/{s.w ?? 0}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.o ?? 0} overs</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scorecard */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading scorecard...</div>
        ) : scorecard ? (
          <div>
            {Object.entries(scorecard).filter(([k]) => k !== 'id' && k !== 'name').map(([inning, data]: [string, any]) => (
              data?.batting ? (
                <div key={inning} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 16 }}>{inning}</div>

                  {/* Batting */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>BATTING</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)' }}>
                            {['Batter', 'R', 'B', '4s', '6s', 'SR'].map(h => (
                              <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Batter' ? 'left' : 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.batting?.map((b: any, i: number) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)', opacity: b['dismissal-text'] === 'batting' || b['dismissal-text'] === '' ? 1 : 0.7 }}>
                              <td style={{ padding: '8px', fontWeight: b['dismissal-text'] === 'batting' ? 700 : 400 }}>
                                <div style={{ color: 'var(--text-primary)' }}>{b.batsman?.name ?? b.batsman}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b['dismissal-text'] === 'batting' ? '🟢 batting' : b['dismissal-text']}</div>
                              </td>
                              <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: parseInt(b.r) >= 50 ? '#f0a500' : 'var(--text-primary)' }}>{b.r}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{b.b}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{b['4s']}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{b['6s']}</td>
                              <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: parseFloat(b.sr) >= 150 ? 'var(--accent)' : 'var(--text-secondary)' }}>{b.sr}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bowling */}
                  {data.bowling && data.bowling.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>BOWLING</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid var(--border)' }}>
                              {['Bowler', 'O', 'M', 'R', 'W', 'Econ'].map(h => (
                                <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Bowler' ? 'left' : 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {data.bowling.map((b: any, i: number) => (
                              <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '8px', color: 'var(--text-primary)' }}>{b.bowler?.name ?? b.bowler}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{b.o}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{b.m}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{b.r}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: parseInt(b.w) >= 3 ? 'var(--accent)' : 'var(--text-primary)' }}>{b.w}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: parseFloat(b.eco) <= 7 ? 'var(--accent)' : parseFloat(b.eco) >= 10 ? 'var(--live-red)' : 'var(--text-secondary)' }}>{b.eco}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : null
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Scorecard not available yet
          </div>
        )}

        {/* Betting Section */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginBottom: 16, color: 'var(--accent)' }}>🎯 BETTING MARKETS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { name: 'Match Winner', odds: [match.teams?.[0], match.teams?.[1]], values: ['1.85', '2.00'] },
              { name: 'Toss Winner', odds: [match.teams?.[0], match.teams?.[1]], values: ['1.90', '1.95'] },
              { name: 'Total Runs', odds: ['Over 160.5', 'Under 160.5'], values: ['1.90', '1.90'] },
            ].map(market => (
              <div key={market.name} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{market.name}</div>
                {market.odds.map((o, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 10px', marginBottom: 6, background: 'var(--bg-card)',
                    borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)' }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: 'var(--accent)' }}>{market.values[i]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Log in and add to bet slip to place bets
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CricketLivePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Match | null>(null)
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchMatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch(`${BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`)
      const data = await res.json()
      if (data.status === 'success' && data.data) {
        setMatches(data.data)
        setLastUpdated(new Date())
        setError('')
      } else {
        setError(data.reason ?? 'Failed to fetch matches')
      }
    } catch (e) {
      setError('Network error — check your connection')
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    fetchMatches()
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchMatches(true), 30000)
    return () => clearInterval(interval)
  }, [fetchMatches])

  const filtered = matches.filter(m => {
    if (filter === 'live')      return m.matchStarted && !m.matchEnded
    if (filter === 'upcoming')  return !m.matchStarted
    if (filter === 'completed') return m.matchEnded
    return true
  })

  const liveCount     = matches.filter(m => m.matchStarted && !m.matchEnded).length
  const upcomingCount = matches.filter(m => !m.matchStarted).length

  return (
    <Layout>
      <Head><title>Cricket Live Scores — BetPro</title></Head>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0a1a0a 0%, #0a1628 50%, #1a0a2e 100%)',
        borderBottom: '1px solid var(--border)', padding: '28px 24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, marginBottom: 6 }}>
              🏏 CRICKET <span style={{ color: 'var(--accent)' }}>LIVE</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Real-time scores, scorecards & betting markets · Powered by CricAPI
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button onClick={() => fetchMatches(true)} disabled={refreshing} style={{
              background: refreshing ? 'var(--bg-elevated)' : 'var(--accent)',
              color: refreshing ? 'var(--text-muted)' : '#000',
              border: 'none', borderRadius: 'var(--radius)', padding: '10px 20px',
              fontWeight: 700, fontSize: 13, cursor: refreshing ? 'not-allowed' : 'pointer',
            }}>
              {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
            {lastUpdated && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Updated: {lastUpdated.toLocaleTimeString('en-IN')}
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Live Now', value: liveCount, color: '#e03f3f' },
            { label: 'Upcoming', value: upcomingCount, color: '#f0a500' },
            { label: 'Total Matches', value: matches.length, color: 'var(--accent)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 22, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['all', 'live', 'upcoming', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '8px 20px', borderRadius: 20,
              background: filter === f ? 'var(--accent)' : 'var(--bg-elevated)',
              color: filter === f ? '#000' : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
              fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {f === 'live' && liveCount > 0 ? `🔴 LIVE (${liveCount})` : f.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, height: 200, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Failed to load matches</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error}</div>
            <button onClick={() => fetchMatches()} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius)', padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Try Again</button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏏</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>No {filter} matches found</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {filtered.map(match => (
              <MatchCard key={match.id} match={match} onClick={() => setSelected(match)} />
            ))}
          </div>
        )}
      </div>

      {/* Match Detail Modal */}
      {selected && <MatchDetail match={selected} onClose={() => setSelected(null)} />}
    </Layout>
  )
}
