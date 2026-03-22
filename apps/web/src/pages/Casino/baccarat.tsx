import { useState } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const RED_SUITS = ['♥','♦']

interface Card { rank: string; suit: string }
type Bet = 'player' | 'banker' | 'tie' | null
type Phase = 'idle' | 'done'

function cardValue(rank: string): number {
  if (['10','J','Q','K'].includes(rank)) return 0
  if (rank === 'A') return 1
  return parseInt(rank)
}

function handValue(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + cardValue(c.rank), 0) % 10
}

function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function CardView({ card }: { card: Card }) {
  const isRed = RED_SUITS.includes(card.suit)
  return (
    <div style={{
      width: 54, height: 78, borderRadius: 8, background: '#fff',
      border: '2px solid #ddd', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 2,
      fontWeight: 800, color: isRed ? '#e03f3f' : '#0a0c0f',
      flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    }}>
      <span style={{ fontSize: 18 }}>{card.suit}</span>
      <span style={{ fontSize: 14 }}>{card.rank}</span>
    </div>
  )
}

export default function BaccaratPage() {
  const { user, balance, setBalance } = useAuthStore()
  const [stake, setStake] = useState('100')
  const [bet, setBet] = useState<Bet>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [playerCards, setPlayerCards] = useState<Card[]>([])
  const [bankerCards, setBankerCards] = useState<Card[]>([])
  const [result, setResult] = useState<'player' | 'banker' | 'tie' | null>(null)
  const [payout, setPayout] = useState(0)
  const [msg, setMsg] = useState('')
  const [history, setHistory] = useState<Array<{ result: string; won: boolean; payout: number }>>([])
  const [error, setError] = useState('')

  const PAYOUTS = { player: 2, banker: 1.95, tie: 9 }

  function play() {
    const amt = parseFloat(stake)
    if (!user) { setError('Log in to play'); return }
    if (!bet) { setError('Choose Player, Banker, or Tie'); return }
    if (!amt || amt < 10) { setError('Min ₹10'); return }
    if (amt > balance) { setError('Insufficient balance'); return }
    setError('')
    setBalance(balance - amt)

    const deck = buildDeck()
    let p = [deck[0], deck[2]]
    let b = [deck[1], deck[3]]
    let idx = 4

    const pVal = handValue(p)
    const bVal = handValue(b)

    // Natural — no more cards
    if (pVal < 8 && bVal < 8) {
      // Player draws third card if 0-5
      if (pVal <= 5) { p = [...p, deck[idx++]] }

      const pVal2 = handValue(p)
      const p3 = p[2] ? cardValue(p[2].rank) : null

      // Banker draws based on banker value and player third card
      if (bVal <= 2) { b = [...b, deck[idx++]] }
      else if (bVal === 3 && p3 !== 8) { b = [...b, deck[idx++]] }
      else if (bVal === 4 && p3 !== null && [2,3,4,5,6,7].includes(p3)) { b = [...b, deck[idx++]] }
      else if (bVal === 5 && p3 !== null && [4,5,6,7].includes(p3)) { b = [...b, deck[idx++]] }
      else if (bVal === 6 && p3 !== null && [6,7].includes(p3)) { b = [...b, deck[idx++]] }
    }

    setPlayerCards(p)
    setBankerCards(b)

    const finalP = handValue(p)
    const finalB = handValue(b)

    let r: 'player' | 'banker' | 'tie'
    if (finalP > finalB) r = 'player'
    else if (finalB > finalP) r = 'banker'
    else r = 'tie'

    setResult(r)

    const won = bet === r
    const tie = r === 'tie' && bet === 'tie'
    let pay = 0

    if (won || tie) {
      pay = amt * PAYOUTS[bet!]
      setBalance(prev => prev + pay)
    } else if (r === 'tie' && bet !== 'tie') {
      // Tie returns bet for player/banker bets
      pay = amt
      setBalance(prev => prev + pay)
    }

    setPayout(pay)

    const resultLabel = r === 'player' ? 'PLAYER WINS' : r === 'banker' ? 'BANKER WINS' : 'TIE'
    const betLabel = bet!.toUpperCase()

    setMsg(
      won ? `🎉 ${betLabel} BET WINS! +₹${(pay - amt).toFixed(0)}` :
      (r === 'tie' && bet !== 'tie') ? `🤝 TIE — Bet Returned` :
      `❌ ${resultLabel} — You bet ${betLabel}`
    )

    setHistory(prev => [{ result: r, won: won || (r === 'tie' && bet !== 'tie'), payout: pay }, ...prev.slice(0, 19)])
    setPhase('done')
  }

  function reset() {
    setPhase('idle')
    setBet(null)
    setPlayerCards([])
    setBankerCards([])
    setResult(null)
    setMsg('')
  }

  const pVal = playerCards.length > 0 ? handValue(playerCards) : null
  const bVal = bankerCards.length > 0 ? handValue(bankerCards) : null

  const BET_OPTIONS = [
    { id: 'player', label: 'PLAYER', payout: '1:1', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { id: 'tie', label: 'TIE', payout: '8:1', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { id: 'banker', label: 'BANKER', payout: '0.95:1', color: '#e03f3f', bg: 'rgba(224,63,63,0.1)' },
  ]

  return (
    <Layout hideSidebar>
      <Head><title>Baccarat — BetPro Casino</title></Head>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>
          🎰 BACCARAT
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Classic Punto Banco. Bet on Player, Banker, or Tie. Closest to 9 wins!
        </div>

        {/* Result banner */}
        {phase === 'done' && (
          <div style={{
            background: msg.startsWith('🎉') ? 'rgba(0,212,170,0.1)' : msg.startsWith('🤝') ? 'rgba(240,165,0,0.1)' : 'rgba(224,63,63,0.1)',
            border: `1px solid ${msg.startsWith('🎉') ? 'var(--accent)' : msg.startsWith('🤝') ? '#f0a500' : 'var(--live-red)'}`,
            borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20,
            textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 20, color: msg.startsWith('🎉') ? 'var(--accent)' : msg.startsWith('🤝') ? '#f0a500' : 'var(--live-red)',
          }}>{msg}</div>
        )}

        {/* Table */}
        <div style={{
          background: 'linear-gradient(160deg, #0a1a2e 0%, #051015 100%)',
          border: '2px solid #1a3050', borderRadius: 16, padding: 24, marginBottom: 20,
        }}>
          {/* Banker */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                BANKER {result === 'banker' ? '👑' : ''}
              </span>
              {bVal !== null && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 28,
                  color: result === 'banker' ? '#e03f3f' : 'var(--text-secondary)',
                }}>{bVal}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {bankerCards.length > 0 ? bankerCards.map((c, i) => <CardView key={i} card={c} />) :
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, paddingTop: 24 }}>Cards will appear here</div>}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 24 }} />

          {/* Player */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                PLAYER {result === 'player' ? '👑' : ''}
              </span>
              {pVal !== null && (
                <span style={{
                  fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 28,
                  color: result === 'player' ? '#3b82f6' : 'var(--text-secondary)',
                }}>{pVal}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {playerCards.length > 0 ? playerCards.map((c, i) => <CardView key={i} card={c} />) :
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, paddingTop: 24 }}>Cards will appear here</div>}
            </div>
          </div>
        </div>

        {/* Bet selection */}
        {phase === 'idle' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {BET_OPTIONS.map(opt => (
                <button key={opt.id} onClick={() => setBet(opt.id as Bet)} style={{
                  padding: '16px 8px', borderRadius: 'var(--radius)',
                  border: `2px solid ${bet === opt.id ? opt.color : 'var(--border)'}`,
                  background: bet === opt.id ? opt.bg : 'var(--bg-elevated)',
                  color: bet === opt.id ? opt.color : 'var(--text-secondary)',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                  cursor: 'pointer', textAlign: 'center',
                }}>
                  {opt.label}
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 4, opacity: 0.7 }}>{opt.payout}</div>
                </button>
              ))}
            </div>

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
              <button onClick={play} disabled={!bet} style={{
                padding: '11px 32px', background: bet ? 'var(--accent)' : 'var(--bg-elevated)',
                color: bet ? '#000' : 'var(--text-muted)', borderRadius: 'var(--radius)', border: 'none',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                cursor: bet ? 'pointer' : 'not-allowed', minWidth: 130,
              }}>DEAL</button>
            </div>
          </>
        )}

        {phase === 'done' && (
          <button onClick={reset} style={{
            width: '100%', padding: '14px', background: 'var(--accent)', color: '#000',
            borderRadius: 'var(--radius)', border: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
          }}>NEW GAME</button>
        )}

        {error && <div style={{ color: 'var(--live-red)', fontSize: 13, marginTop: 12 }}>{error}</div>}

        {/* Rules */}
        <div style={{ marginTop: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Rules</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            10s and face cards = 0. Ace = 1. Hand value is last digit of sum. Closest to 9 wins. Naturals (8 or 9) stop drawing.
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>History</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {history.map((h, i) => (
                <span key={i} style={{
                  padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: h.result === 'player' ? 'rgba(59,130,246,0.15)' : h.result === 'banker' ? 'rgba(224,63,63,0.15)' : 'rgba(34,197,94,0.15)',
                  color: h.result === 'player' ? '#3b82f6' : h.result === 'banker' ? '#e03f3f' : '#22c55e',
                }}>{h.result === 'player' ? 'P' : h.result === 'banker' ? 'B' : 'T'}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
