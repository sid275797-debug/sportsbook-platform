import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import { fixturesApi, bettingApi, walletApi } from '../../lib/api'

const CRIC_API_KEY = '0e867a61-e49d-45df-a839-196c667f603d'
const CRIC_BASE = 'https://api.cricapi.com/v1'

// Market grouping config
const MARKET_GROUPS = {
  match: {
    label: 'Match Markets',
    icon: 'ðŸ†',
    types: ['match_winner', 'toss_winner', 'total_runs', 'first_over'],
  },
  batsman: {
    label: 'Player Markets',
    icon: 'ðŸ',
    types: ['top_batsman', 'top_bowler'],
  },
  session: {
    label: 'Session Markets',
    icon: 'ðŸ“Š',
    types: [
      'session_powerplay_runs', 'session_powerplay_wickets', 'session_powerplay_boundaries',
      'session_middle_runs', 'session_7_10_runs', 'session_11_15_runs',
      'session_death_runs', 'session_death_sixes',
      'session_total_runs', 'session_total_sixes', 'session_total_fours',
      'session_first_partnership',
    ],
  },
}

const PHASE_COLORS: Record<string, string> = {
  powerplay:  '#534AB7',
  middle:     '#0F6E56',
  death:      '#BA7517',
  full_match: 'var(--accent)',
  in_play:    '#e03f3f',
}

const SESSION_PHASE_MAP: Record<string, string> = {
  session_powerplay_runs: 'powerplay', session_powerplay_wickets: 'powerplay', session_powerplay_boundaries: 'powerplay',
  session_middle_runs: 'middle', session_7_10_runs: 'middle', session_11_15_runs: 'middle',
  session_death_runs: 'death', session_death_sixes: 'death',
  session_total_runs: 'full_match', session_total_sixes: 'full_match', session_total_fours: 'full_match',
  session_first_partnership: 'in_play',
}

interface BetSelection {
  fixtureId: string; marketId: string; outcomeId: string
  marketName: string; outcome: string; odds: number; stake: string
}

function MarketCard({ market, fixtureId, onSelect, selections }: {
  market: any; fixtureId: string; onSelect: (sel: BetSelection) => void; selections: BetSelection[]
}) {
  const phase = SESSION_PHASE_MAP[market.type]
  const phaseColor = phase ? PHASE_COLORS[phase] : 'var(--accent)'

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {phase && <span style={{ width: 3, height: 20, borderRadius: 2, background: phaseColor, display: 'inline-block', flexShrink: 0 }} />}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13 }}>{market.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            {market.inPlay ? 'ðŸ”´ In-Play' : 'ðŸ“… Pre-Match'} Â· {market.outcomes?.length ?? 0} outcomes
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(market.outcomes?.length ?? 2, 3)}, 1fr)`, gap: 6 }}>
        {market.outcomes?.filter((o: any) => o.isActive).map((outcome: any) => {
          const isSel = selections.some(s => s.outcomeId === outcome.id)
          return (
            <button key={outcome.id} onClick={() => onSelect({
              fixtureId, marketId: market.id, outcomeId: outcome.id,
              marketName: market.name, outcome: outcome.name,
              odds: Number(outcome.odds), stake: '100',
            })} style={{
              padding: '10px 6px', borderRadius: 'var(--radius)',
              background: isSel ? 'rgba(0,212,170,0.15)' : 'var(--bg-elevated)',
              border: `2px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 3, lineHeight: 1.3 }}>{outcome.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: isSel ? 'var(--accent)' : 'var(--text-primary)' }}>
                {Number(outcome.odds).toFixed(2)}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BetSlip({ selections, onRemove, onClear, onStakeChange }: {
  selections: BetSelection[]; onRemove: (id: string) => void
  onClear: () => void; onStakeChange: (id: string, stake: string) => void
}) {
  const { user, balance, setBalance } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const totalStake = selections.reduce((s, x) => s + parseFloat(x.stake || '0'), 0)
  const potentialWin = selections.reduce((s, x) => s + parseFloat(x.stake || '0') * x.odds, 0)

  async function place() {
    if (!user || selections.length === 0) return
    setLoading(true); setResult(null)
    try {
      await bettingApi.placeBet({
        selections: selections.map(s => ({ marketId: s.marketId, outcomeId: s.outcomeId, odds: s.odds, stake: parseFloat(s.stake || '100') })),
        totalStake,
      })
      try { const b = await walletApi.balance(); setBalance(b.data.data?.available ?? balance) } catch {}
      setResult({ ok: true, msg: `Bet placed! Potential win: â‚¹${potentialWin.toFixed(0)}` })
      setTimeout(() => { onClear(); setResult(null) }, 3000)
    } catch (err: any) {
      setResult({ ok: false, msg: err.response?.data?.error ?? 'Bet failed' })
    } finally { setLoading(false) }
  }

  if (selections.length === 0) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>ðŸŽ¯</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Bet Slip Empty</div>
      <div style={{ fontSize: 12 }}>Click odds to add selections</div>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>ðŸŽ¯ BET SLIP <span style={{ fontSize: 11, color: 'var(--accent)' }}>{selections.length}</span></div>
        <button onClick={onClear} style={{ fontSize: 12, color: 'var(--live-red)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear All</button>
      </div>
      {selections.map(sel => (
        <div key={sel.outcomeId} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{sel.marketName}</div>
              <div style={{ fontWeight: 700, fontSize: 12, marginTop: 2 }}>{sel.outcome}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: 'var(--accent)' }}>{sel.odds.toFixed(2)}</span>
              <button onClick={() => onRemove(sel.outcomeId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>âœ•</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>â‚¹</span>
            <input type="number" value={sel.stake} onChange={e => onStakeChange(sel.outcomeId, e.target.value)}
              style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontSize: 13 }} />
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>Win: â‚¹{(parseFloat(sel.stake || '0') * sel.odds).toFixed(0)}</div>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
        {[['Total Stake', `â‚¹${totalStake.toFixed(0)}`], ['Potential Win', `â‚¹${potentialWin.toFixed(0)}`]].map(([l, v], i) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: i === 1 ? 800 : 600, fontSize: i === 1 ? 16 : 13, color: i === 1 ? 'var(--accent)' : 'var(--text-primary)' }}>{v}</span>
          </div>
        ))}
        {result && (
          <div style={{ background: result.ok ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)', border: `1px solid ${result.ok ? 'var(--accent)' : 'var(--live-red)'}`, borderRadius: 6, padding: '8px 10px', marginBottom: 10, fontSize: 12, color: result.ok ? 'var(--accent)' : 'var(--live-red)' }}>
            {result.ok ? 'âœ… ' : 'âŒ '}{result.msg}
          </div>
        )}
        {!user
          ? <Link href="/login" style={{ display: 'block', padding: '12px', background: 'var(--accent)', color: '#000', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>LOGIN TO BET</Link>
          : <button onClick={place} disabled={loading || totalStake <= 0} style={{ width: '100%', padding: '12px', background: loading || totalStake <= 0 ? 'var(--bg-elevated)' : 'var(--accent)', color: loading || totalStake <= 0 ? 'var(--text-muted)' : '#000', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              {loading ? 'PLACING...' : 'PLACE BET'}
            </button>
        }
        {user && <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>Balance: â‚¹{balance.toLocaleString('en-IN')}</div>}
      </div>
    </div>
  )
}

export default function CricketBettingPage() {
  const [fixtures, setFixtures] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState<BetSelection[]>([])
  const [activeTab, setActiveTab] = useState<'match' | 'batsman' | 'session'>('match')
  const [liveScores, setLiveScores] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const res = await fixturesApi.upcoming({ sport: 'cricket', limit: '20', includeMarkets: 'true' })
        const data = res.data.data ?? []
        setFixtures(data)
        if (data.length > 0) setSelected(data[0])
      } catch {}
      setLoading(false)
    }
    async function loadScores() {
      try {
        const res = await fetch(`${CRIC_BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`)
        const data = await res.json()
        if (data.status === 'success') setLiveScores(data.data ?? [])
      } catch {}
    }
    load()
    loadScores()
    const t = setInterval(loadScores, 30000)
    return () => clearInterval(t)
  }, [])

  function handleSelect(sel: BetSelection) {
    setSelections(prev => {
      const idx = prev.findIndex(s => s.marketId === sel.marketId)
      if (idx >= 0) {
        const u = [...prev]
        if (u[idx].outcomeId === sel.outcomeId) { u.splice(idx, 1); return u }
        u[idx] = sel; return u
      }
      return [...prev, sel]
    })
  }

  // Get markets for active tab
  const tabMarkets = selected?.markets?.filter((m: any) => {
    const group = MARKET_GROUPS[activeTab]
    return group?.types.includes(m.type)
  }) ?? []

  // Find live score for selected fixture
  const liveScore = selected ? liveScores.find((m: any) =>
    m.teams?.some((t: string) =>
      t.toLowerCase().includes(selected.homeTeam?.name?.split(' ')[0]?.toLowerCase() ?? '')
    )
  ) : null

  const sessionGroups = {
    powerplay: tabMarkets.filter((m: any) => SESSION_PHASE_MAP[m.type] === 'powerplay'),
    middle:    tabMarkets.filter((m: any) => SESSION_PHASE_MAP[m.type] === 'middle'),
    death:     tabMarkets.filter((m: any) => SESSION_PHASE_MAP[m.type] === 'death'),
    full_match:tabMarkets.filter((m: any) => SESSION_PHASE_MAP[m.type] === 'full_match'),
    in_play:   tabMarkets.filter((m: any) => SESSION_PHASE_MAP[m.type] === 'in_play'),
  }

  return (
    <Layout>
      <Head><title>Cricket Betting â€” BetPro</title></Head>

      <div style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #0a1628 100%)', borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
          ðŸ CRICKET <span style={{ color: 'var(--accent)' }}>BETTING</span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Match Â· Sessions Â· Player markets Â· Powerplay Â· Death overs Â· IPL 2026
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Link href="/cricket/live" style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.3)', borderRadius: 'var(--radius)', padding: '7px 14px', color: '#e03f3f', fontWeight: 700, fontSize: 12 }}>ðŸ”´ Live Scores</Link>
          <Link href="/cricket/ipl" style={{ background: 'rgba(249,205,5,0.08)', border: '1px solid rgba(249,205,5,0.2)', borderRadius: 'var(--radius)', padding: '7px 14px', color: '#F9CD05', fontWeight: 700, fontSize: 12 }}>ðŸ† IPL 2026</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 300px', maxWidth: 1400, margin: '0 auto' }}>

        {/* Left: Match list */}
        <div style={{ borderRight: '1px solid var(--border)', padding: '14px', overflowY: 'auto', maxHeight: '85vh' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>IPL 2026 Matches</div>
          {loading ? Array.from({length: 5}).map((_, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 8, height: 72, marginBottom: 8 }} />
          )) : fixtures.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>No fixtures found</div>
          ) : fixtures.map(f => {
            const isLive = f.status === 'live'
            const isSel = selected?.id === f.id
            // Find live score
            const score = liveScores.find((m: any) => m.teams?.some((t: string) => t.toLowerCase().includes(f.homeTeam?.name?.split(' ')[0]?.toLowerCase() ?? '')))
            return (
              <button key={f.id} onClick={() => setSelected(f)} style={{
                width: '100%', background: isSel ? 'rgba(0,212,170,0.08)' : 'var(--bg-card)',
                border: `2px solid ${isSel ? 'var(--accent)' : isLive ? 'rgba(224,63,63,0.3)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', padding: '10px 12px', cursor: 'pointer',
                textAlign: 'left', marginBottom: 8, transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{f.homeTeam?.shortName} vs {f.awayTeam?.shortName}</div>
                  {isLive && <span style={{ fontSize: 8, background: '#e03f3f', color: '#fff', padding: '2px 5px', borderRadius: 3, fontWeight: 800 }}>LIVE</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ðŸ“ {f.venue?.split(',')[0]}</div>
                {score?.score && score.score.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 10, color: '#f0a500', fontFamily: 'var(--font-mono)' }}>
                    {score.score.map((s: any) => `${s.r}/${s.w}(${s.o})`).join(' | ')}
                  </div>
                )}
                {f.markets && (
                  <div style={{ marginTop: 4, fontSize: 10, color: 'var(--accent)' }}>{f.markets.length} markets available</div>
                )}
              </button>
            )
          })}
        </div>

        {/* Center: Markets */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', maxHeight: '85vh', borderRight: '1px solid var(--border)' }}>
          {selected ? (
            <>
              {/* Match header */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
                    {selected.homeTeam?.name} vs {selected.awayTeam?.name}
                  </div>
                  {selected.status === 'live'
                    ? <span style={{ fontSize: 9, background: '#e03f3f', color: '#fff', padding: '3px 8px', borderRadius: 4, fontWeight: 800 }}>ðŸ”´ LIVE</span>
                    : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(selected.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  }
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ðŸ“ {selected.venue} Â· IPL 2026</div>
                {liveScore?.score && liveScore.score.length > 0 && (
                  <div style={{ marginTop: 10, background: 'var(--bg-elevated)', borderRadius: 8, padding: '8px 12px' }}>
                    {liveScore.score.map((s: any, i: number) => (
                      <div key={i} style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: 2 }}>
                        <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>{s.inning?.replace('Inning', 'Inn')}</span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{s.r}/{s.w}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>({s.o} ov)</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: '#f0a500', marginTop: 4 }}>{liveScore.status}</div>
                  </div>
                )}
              </div>

              {/* Market tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                {Object.entries(MARKET_GROUPS).map(([key, group]) => {
                  const count = selected?.markets?.filter((m: any) => group.types.includes(m.type)).length ?? 0
                  return (
                    <button key={key} onClick={() => setActiveTab(key as any)} style={{
                      padding: '10px 14px', background: 'none', border: 'none',
                      borderBottom: `3px solid ${activeTab === key ? 'var(--accent)' : 'transparent'}`,
                      color: activeTab === key ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap',
                    }}>
                      {group.icon} {group.label} <span style={{ fontSize: 10, opacity: 0.7 }}>({count})</span>
                    </button>
                  )
                })}
              </div>

              {/* Market content */}
              {tabMarkets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>ðŸ“Š</div>
                  <div>No {MARKET_GROUPS[activeTab].label.toLowerCase()} available for this match</div>
                </div>
              ) : activeTab === 'session' ? (
                // Session markets grouped by phase
                <>
                  {[
                    { key: 'powerplay', label: 'âš¡ Powerplay (Overs 1-6)', color: PHASE_COLORS.powerplay },
                    { key: 'middle',    label: 'ðŸŽ¯ Middle Overs (7-15)',   color: PHASE_COLORS.middle    },
                    { key: 'death',     label: 'ðŸ’¥ Death Overs (16-20)',   color: PHASE_COLORS.death     },
                    { key: 'full_match',label: 'ðŸ Full Match',            color: PHASE_COLORS.full_match },
                    { key: 'in_play',   label: 'ðŸ”´ In-Play',               color: PHASE_COLORS.in_play   },
                  ].map(({ key, label, color }) => {
                    const groupMarkets = sessionGroups[key as keyof typeof sessionGroups]
                    if (!groupMarkets || groupMarkets.length === 0) return null
                    return (
                      <div key={key} style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 4, height: 18, borderRadius: 2, background: color }} />
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color }}>{label}</div>
                        </div>
                        {groupMarkets.map((m: any) => (
                          <MarketCard key={m.id} market={m} fixtureId={selected.id} onSelect={handleSelect} selections={selections} />
                        ))}
                      </div>
                    )
                  })}
                </>
              ) : (
                tabMarkets.map((m: any) => (
                  <MarketCard key={m.id} market={m} fixtureId={selected.id} onSelect={handleSelect} selections={selections} />
                ))
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>ðŸ</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Select a match to bet</div>
            </div>
          )}
        </div>

        {/* Right: Bet Slip */}
        <div style={{ padding: '14px', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <BetSlip
            selections={selections}
            onRemove={id => setSelections(p => p.filter(s => s.outcomeId !== id))}
            onClear={() => setSelections([])}
            onStakeChange={(id, stake) => setSelections(p => p.map(s => s.outcomeId === id ? { ...s, stake } : s))}
          />
        </div>
      </div>
    </Layout>
  )
}