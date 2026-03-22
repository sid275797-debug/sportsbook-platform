import { useState } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const RANK_VALUES: Record<string, number> = { A:14,K:13,Q:12,J:11,'10':10,'9':9,'8':8,'7':7,'6':6,'5':5,'4':4,'3':3,'2':2 }
const RED_SUITS = ['♥','♦']

interface Card { rank: string; suit: string }
type Phase = 'idle' | 'playing' | 'done'
type Outcome = 'win' | 'lose' | 'tie' | null

function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function handRank(hand: Card[]): number {
  const sorted = [...hand].sort((a, b) => RANK_VALUES[b.rank] - RANK_VALUES[a.rank])
  const vals = sorted.map(c => RANK_VALUES[c.rank])
  const suits = hand.map(c => c.suit)
  const ranks = hand.map(c => c.rank)

  const isFlush = suits.every(s => s === suits[0])
  const isSequence = vals[0] - vals[1] === 1 && vals[1] - vals[2] === 1
  const isTriple = vals[0] === vals[1] && vals[1] === vals[2]
  const isPair = vals[0] === vals[1] || vals[1] === vals[2]

  if (isFlush && isSequence && vals[0] === 14) return 6000 + vals[0] // Royal Flush
  if (isFlush && isSequence) return 5000 + vals[0]                    // Straight Flush
  if (isTriple) return 4000 + vals[0]                                 // Three of a Kind
  if (isSequence) return 3000 + vals[0]                               // Straight
  if (isFlush) return 2000 + vals[0]                                  // Flush
  if (isPair) return 1000 + (vals[0] === vals[1] ? vals[0] : vals[1]) // Pair
  return vals[0]                                                        // High card
}

function handName(score: number): string {
  if (score >= 6000) return 'Royal Flush'
  if (score >= 5000) return 'Straight Flush'
  if (score >= 4000) return 'Three of a Kind'
  if (score >= 3000) return 'Straight'
  if (score >= 2000) return 'Flush'
  if (score >= 1000) return 'Pair'
  return 'High Card'
}

function CardView({ card, hidden }: { card?: Card; hidden?: boolean }) {
  const isRed = card && RED_SUITS.includes(card.suit)
  return (
    <div style={{
      width: 56, height: 80, borderRadius: 8,
      background: hidden ? '#1e2533' : '#fff',
      border: `2px solid ${hidden ? '#2e3a4e' : '#ddd'}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2,
      fontWeight: 800, color: hidden ? '#555' : (isRed ? '#e03f3f' : '#0a0c0f'),
      flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    }}>
      {hidden ? '?' : <><span style={{ fontSize: 18 }}>{card!.suit}</span><span style={{ fontSize: 14 }}>{card!.rank}</span></>}
    </div>
  )
}

export default function TeenPattiPage() {
  const { user, balance, setBalance } = useAuthStore()
  const [stake, setStake] = useState('100')
  const [phase, setPhase] = useState<Phase>('idle')
  const [player, setPlayer] = useState<Card[]>([])
  const [dealer, setDealer] = useState<Card[]>([])
  const [outcome, setOutcome] = useState<Outcome>(null)
  const [msg, setMsg] = useState('')
  const [showDealer, setShowDealer] = useState(false)
  const [history, setHistory] = useState<Array<{ outcome: Outcome; payout: number }>>([])
  const [error, setError] = useState('')
  const [sidebet, setSidebet] = useState(false)

  function deal() {
    const amt = parseFloat(stake)
    if (!user) { setError('Log in to play'); return }
    if (!amt || amt < 10) { setError('Min ₹10'); return }
    if (amt > balance) { setError('Insufficient balance'); return }
    setError('')
    const deck = buildDeck()
    const p = [deck[0], deck[2], deck[4]]
    const d = [deck[1], deck[3], deck[5]]
    setPlayer(p)
    setDealer(d)
    setPhase('playing')
    setOutcome(null)
    setMsg('')
    setShowDealer(false)
    setBalance(balance - amt)
  }

  function seen() {
    // Player looks at cards — no special mechanics, just show
  }

  function callBlind() {
    // Continue without seeing cards — in real Teen Patti blind bet is half
    showdown()
  }

  function showdown() {
    setShowDealer(true)
    const pScore = handRank(player)
    const dScore = handRank(dealer)
    const amt = parseFloat(stake)
    let result: Outcome
    let payout = 0

    if (pScore > dScore) {
      result = 'win'
      payout = amt * 2
      setBalance(prev => prev + payout)
    } else if (pScore < dScore) {
      result = 'lose'
      payout = 0
    } else {
      result = 'tie'
      payout = amt
      setBalance(prev => prev + payout)
    }

    setOutcome(result)
    const pName = handName(pScore)
    const dName = handName(dScore)
    setMsg(
      result === 'win' ? `🎉 YOU WIN! ${pName} beats ${dName}` :
      result === 'lose' ? `❌ DEALER WINS with ${dName}` :
      `🤝 TIE! Both have ${pName}`
    )
    setHistory(prev => [{ outcome: result, payout }, ...prev.slice(0, 19)])
    setPhase('done')
  }

  function reset() {
    setPhase('idle')
    setPlayer([])
    setDealer([])
    setOutcome(null)
    setMsg('')
    setShowDealer(false)
  }

  const pScore = player.length === 3 ? handRank(player) : 0
  const pName = player.length === 3 ? handName(pScore) : ''

  return (
    <Layout hideSidebar>
      <Head><title>Teen Patti — BetPro Casino</title></Head>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>
          🎴 TEEN PATTI
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Indian 3-card poker. Best hand wins. Pairs, Straights, Flushes, Trials!
        </div>

        {/* Result */}
        {phase === 'done' && (
          <div style={{
            background: outcome === 'win' ? 'rgba(0,212,170,0.1)' : outcome === 'lose' ? 'rgba(224,63,63,0.1)' : 'rgba(240,165,0,0.1)',
            border: `1px solid ${outcome === 'win' ? 'var(--accent)' : outcome === 'lose' ? 'var(--live-red)' : '#f0a500'}`,
            borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20,
            textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 20, color: outcome === 'win' ? 'var(--accent)' : outcome === 'lose' ? 'var(--live-red)' : '#f0a500',
          }}>{msg}</div>
        )}

        {/* Table */}
        <div style={{
          background: 'linear-gradient(160deg, #1a0a2e 0%, #0a1020 100%)',
          border: '2px solid #2a1a4e', borderRadius: 16, padding: 24, marginBottom: 20,
        }}>
          {/* Dealer */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
              DEALER {showDealer && player.length === 3 ? `— ${handName(handRank(dealer))}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {dealer.length > 0 ? dealer.map((c, i) => (
                <CardView key={i} card={c} hidden={!showDealer} />
              )) : [0,1,2].map(i => <CardView key={i} hidden />)}
            </div>
          </div>

          {/* Player */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
              YOUR HAND {phase !== 'idle' ? `— ${pName}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {player.length > 0 ? player.map((c, i) => (
                <CardView key={i} card={c} />
              )) : [0,1,2].map(i => <CardView key={i} hidden />)}
            </div>
          </div>
        </div>

        {/* Hand rankings guide */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Hand Rankings (High → Low)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Royal Flush','Straight Flush','Trial (3 of a Kind)','Straight','Flush','Pair','High Card'].map((h, i) => (
              <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{h}</span>
            ))}
          </div>
        </div>

        {/* Controls */}
        {phase === 'idle' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Stake (₹)</label>
              <div style={{ display: 'flex', gap: 4 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>₹</span>
                  <input type="number" value={stake} onChange={e => setStake(e.target.value)}
                    style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: '10px 10px 10px 26px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)' }} />
                </div>
                {[100, 500, 1000, 5000].map(v => (
                  <button key={v} onClick={() => setStake(String(v))} style={{ padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    ₹{v >= 1000 ? `${v / 1000}k` : v}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={deal} disabled={!user} style={{
              padding: '11px 32px', background: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius)', border: 'none',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer', minWidth: 130,
            }}>DEAL</button>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={showdown} style={{
              flex: 1, padding: '14px', background: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius)', border: 'none',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>SHOW (Reveal)</button>
            <button onClick={() => { setBalance(prev => prev + parseFloat(stake)); reset() }} style={{
              flex: 1, padding: '14px', background: 'var(--bg-elevated)', color: 'var(--live-red)',
              borderRadius: 'var(--radius)', border: '1px solid var(--live-red)',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>PACK (Fold)</button>
          </div>
        )}

        {phase === 'done' && (
          <button onClick={reset} style={{
            width: '100%', padding: '14px', background: 'var(--accent)', color: '#000',
            borderRadius: 'var(--radius)', border: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}>DEAL AGAIN</button>
        )}

        {error && <div style={{ color: 'var(--live-red)', fontSize: 13, marginTop: 12 }}>{error}</div>}

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>History</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {history.map((h, i) => (
                <span key={i} style={{
                  padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: h.outcome === 'win' ? 'rgba(0,212,170,0.1)' : h.outcome === 'tie' ? 'rgba(240,165,0,0.1)' : 'rgba(224,63,63,0.1)',
                  color: h.outcome === 'win' ? 'var(--accent)' : h.outcome === 'tie' ? '#f0a500' : 'var(--live-red)',
                }}>{h.outcome === 'win' ? '✓ WIN' : h.outcome === 'tie' ? '= TIE' : '✗ LOSE'}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
