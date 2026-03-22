import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import { bettingApi } from '../../lib/api'

const CRIC_API_KEY = '0e867a61-e49d-45df-a839-196c667f603d'
const BASE = 'https://api.cricapi.com/v1'

interface BetSelection {
  marketName: string
  outcome: string
  odds: number
  stake: string
}

const MARKET_TYPES = [
  {
    name: 'Match Winner',
    icon: '🏆',
    desc: 'Which team will win the match?',
    type: 'match_winner',
  },
  {
    name: 'Toss Winner',
    icon: '🪙',
    desc: 'Which team will win the toss?',
    type: 'toss_winner',
  },
  {
    name: 'Total Runs',
    icon: '📊',
    desc: 'Will total runs be over or under the line?',
    type: 'total_runs',
  },
  {
    name: 'Top Batsman',
    icon: '🏏',
    desc: 'Who will score the most runs?',
    type: 'top_batsman',
  },
  {
    name: 'Top Wicket Taker',
    icon: '🎳',
    desc: 'Who will take the most wickets?',
    type: 'top_bowler',
  },
  {
    name: 'First Over Runs',
    icon: '🔢',
    desc: 'How many runs in the first over?',
    type: 'first_over',
  },
]

function generateOdds(base: number, variance = 0.15): number {
  return Math.round((base + (Math.random() - 0.5) * variance) * 100) / 100
}

function MarketCard({
  match,
  market,
  onSelect,
  selections,
}: {
  match: any
  market: typeof MARKET_TYPES[0]
  onSelect: (sel: BetSelection) => void
  selections: BetSelection[]
}) {
  const team1 = match.teams?.[0] ?? 'Team 1'
  const team2 = match.teams?.[1] ?? 'Team 2'

  const getOutcomes = () => {
    switch (market.type) {
      case 'match_winner':
        return [
          { name: team1, odds: generateOdds(1.85) },
          { name: team2, odds: generateOdds(2.0) },
        ]
      case 'toss_winner':
        return [
          { name: `${team1} (Toss)`, odds: generateOdds(1.9) },
          { name: `${team2} (Toss)`, odds: generateOdds(1.95) },
        ]
      case 'total_runs':
        return [
          { name: 'Over 165.5', odds: generateOdds(1.9) },
          { name: 'Under 165.5', odds: generateOdds(1.9) },
        ]
      case 'top_batsman':
        return [
          { name: 'Virat Kohli', odds: generateOdds(3.5) },
          { name: 'Rohit Sharma', odds: generateOdds(4.0) },
          { name: 'KL Rahul', odds: generateOdds(5.0) },
          { name: 'Shubman Gill', odds: generateOdds(5.5) },
        ]
      case 'top_bowler':
        return [
          { name: 'Jasprit Bumrah', odds: generateOdds(3.0) },
          { name: 'Rashid Khan', odds: generateOdds(3.5) },
          { name: 'Mohammed Shami', odds: generateOdds(4.5) },
          { name: 'Yuzvendra Chahal', odds: generateOdds(5.0) },
        ]
      case 'first_over':
        return [
          { name: 'Over 7.5', odds: generateOdds(1.85) },
          { name: 'Under 7.5', odds: generateOdds(1.95) },
        ]
      default:
        return []
    }
  }

  const outcomes = getOutcomes()

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{market.icon}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>{market.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{market.desc}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {outcomes.map((o, i) => {
          const isSelected = selections.some(s => s.marketName === market.name && s.outcome === o.name)
          return (
            <button key={i} onClick={() => onSelect({ marketName: market.name, outcome: o.name, odds: o.odds, stake: '100' })} style={{
              padding: '12px', borderRadius: 'var(--radius)',
              background: isSelected ? 'rgba(0,212,170,0.15)' : 'var(--bg-elevated)',
              border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{o.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>{o.odds.toFixed(2)}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BetSlipPanel({ selections, onRemove, onClear, onPlace }: {
  selections: BetSelection[]
  onRemove: (i: number) => void
  onClear: () => void
  onPlace: () => void
}) {
  const [stakes, setStakes] = useState<Record<number, string>>({})
  const { user, balance } = useAuthStore()

  const totalStake = Object.values(stakes).reduce((s, v) => s + parseFloat(v || '0'), 0)
  const potentialPayout = selections.reduce((total, sel, i) => {
    const stake = parseFloat(stakes[i] || '100')
    return total + stake * sel.odds
  }, 0)

  if (selections.length === 0) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Bet Slip Empty</div>
      <div style={{ fontSize: 12 }}>Click odds to add selections</div>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-lg)', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>🎯 BET SLIP</div>
        <button onClick={onClear} style={{ fontSize: 12, color: 'var(--live-red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Clear All</button>
      </div>

      {selections.map((sel, i) => (
        <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 12, marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sel.marketName}</div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{sel.outcome}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: 'var(--accent)' }}>{sel.odds.toFixed(2)}</span>
              <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹</span>
            <input
              type="number" placeholder="Stake" value={stakes[i] ?? '100'}
              onChange={e => setStakes(prev => ({ ...prev, [i]: e.target.value }))}
              style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            Win: ₹{(parseFloat(stakes[i] || '100') * sel.odds).toFixed(0)}
          </div>
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Stake</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{totalStake.toFixed(0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 15 }}>
          <span style={{ color: 'var(--text-muted)' }}>Potential Win</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>₹{potentialPayout.toFixed(0)}</span>
        </div>
        <button onClick={onPlace} disabled={!user} style={{
          width: '100%', padding: '14px', background: user ? 'var(--accent)' : 'var(--bg-elevated)',
          color: user ? '#000' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, cursor: user ? 'pointer' : 'not-allowed',
        }}>
          {user ? 'PLACE BET' : 'LOGIN TO BET'}
        </button>
        {user && (
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Balance: ₹{balance.toFixed(0)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CricketBettingPage() {
  const [matches, setMatches] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState<BetSelection[]>([])
  const [betPlaced, setBetPlaced] = useState(false)
  const { user } = useAuthStore()

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch(`${BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`)
        const data = await res.json()
        if (data.status === 'success' && data.data) {
          setMatches(data.data)
          if (data.data.length > 0) setSelectedMatch(data.data[0])
        }
      } catch {}
      setLoading(false)
    }
    fetchMatches()
  }, [])

  function handleSelect(sel: BetSelection) {
    setSelections(prev => {
      const existing = prev.findIndex(s => s.marketName === sel.marketName)
      if (existing >= 0) {
        const updated = [...prev]
        if (updated[existing].outcome === sel.outcome) {
          updated.splice(existing, 1)
          return updated
        }
        updated[existing] = sel
        return updated
      }
      return [...prev, sel]
    })
  }

  function handleRemove(i: number) {
    setSelections(prev => prev.filter((_, idx) => idx !== i))
  }

  async function handlePlace() {
    if (!user || selections.length === 0) return
    try {
      setBetPlaced(true)
      setTimeout(() => { setBetPlaced(false); setSelections([]) }, 3000)
    } catch {}
  }

  return (
    <Layout>
      <Head><title>Cricket Betting — BetPro</title></Head>

      <div style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #0a1628 100%)', borderBottom: '1px solid var(--border)', padding: '24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>
          🏏 CRICKET <span style={{ color: 'var(--accent)' }}>BETTING</span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Live & pre-match markets · Match Winner · Toss · Top Batsman · Total Runs & more
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Link href="/cricket/live" style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.3)', borderRadius: 'var(--radius)', padding: '8px 16px', color: '#e03f3f', fontWeight: 700, fontSize: 12 }}>🔴 Live Scores</Link>
          <Link href="/cricket/ipl" style={{ background: 'rgba(249,205,5,0.08)', border: '1px solid rgba(249,205,5,0.2)', borderRadius: 'var(--radius)', padding: '8px 16px', color: '#F9CD05', fontWeight: 700, fontSize: 12 }}>🏆 IPL 2026</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 0, maxWidth: 1400, margin: '0 auto' }}>
        {/* Left: Match list + markets */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', minWidth: 0 }}>

          {/* Match selector */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 }}>Select Match</div>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading matches...</div>
            ) : matches.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No matches available. Check back soon.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.slice(0, 8).map(m => {
                  const isLive = m.matchStarted && !m.matchEnded
                  const isSelected = selectedMatch?.id === m.id
                  return (
                    <button key={m.id} onClick={() => setSelectedMatch(m)} style={{
                      background: isSelected ? 'rgba(0,212,170,0.08)' : 'var(--bg-card)',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{m.name}</div>
                        {isLive && <span style={{ fontSize: 9, background: '#e03f3f', color: '#fff', padding: '2px 6px', borderRadius: 3, fontWeight: 800 }}>LIVE</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{m.matchType?.toUpperCase()} • {m.venue?.split(',')[0]}</div>
                      {m.score && m.score.length > 0 && (
                        <div style={{ fontSize: 11, color: '#f0a500', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                          {m.score.map((s: any) => `${s.r}/${s.w} (${s.o})`).join(' | ')}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Markets */}
          {selectedMatch ? (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, marginBottom: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                🎯 Markets — {selectedMatch.name}
              </div>
              {MARKET_TYPES.map(market => (
                <MarketCard key={market.type} match={selectedMatch} market={market} onSelect={handleSelect} selections={selections} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏏</div>
              <div>Select a match above to see betting markets</div>
            </div>
          )}
        </div>

        {/* Right: Bet Slip */}
        <div style={{ padding: '20px', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          {betPlaced ? (
            <div style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--accent)', marginBottom: 4 }}>BET PLACED!</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Good luck! Check your bets in the dashboard.</div>
            </div>
          ) : (
            <BetSlipPanel selections={selections} onRemove={handleRemove} onClear={() => setSelections([])} onPlace={handlePlace} />
          )}
        </div>
      </div>
    </Layout>
  )
}
