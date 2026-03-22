'use client'
import { useState } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import api from '../../lib/api'

type Suit = '♠' | '♥' | '♦' | '♣'
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
interface Card { rank: Rank; suit: Suit }
type Phase = 'idle' | 'playing' | 'done'
type Outcome = 'win' | 'lose' | 'push' | 'blackjack' | null

const SUITS: Suit[] = ['♠', '♥', '♦', '♣']
const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']

function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit })
  return shuffle(deck)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function cardValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (['J','Q','K'].includes(rank)) return 10
  return parseInt(rank)
}

function handTotal(hand: Card[]): number {
  let total = hand.reduce((s, c) => s + cardValue(c.rank), 0)
  let aces = hand.filter(c => c.rank === 'A').length
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

function CardView({ card, hidden }: { card: Card; hidden?: boolean }) {
  const red = card.suit === '♥' || card.suit === '♦'
  return (
    <div style={{
      width: 60, height: 88, borderRadius: 8,
      background: hidden ? 'var(--bg-elevated)' : '#fff',
      border: '2px solid var(--border-bright)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18,
      color: hidden ? 'var(--text-muted)' : (red ? '#e03f3f' : '#0a0c0f'),
      flexShrink: 0,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      {hidden ? '?' : (
        <>
          <span style={{ fontSize: 20 }}>{card.suit}</span>
          <span style={{ fontSize: 16 }}>{card.rank}</span>
        </>
      )}
    </div>
  )
}

export default function BlackjackPage() {
  const { user, balance, setBalance } = useAuthStore()
  const [stake, setStake]     = useState('100')
  const [deck, setDeck]       = useState<Card[]>([])
  const [player, setPlayer]   = useState<Card[]>([])
  const [dealer, setDealer]   = useState<Card[]>([])
  const [phase, setPhase]     = useState<Phase>('idle')
  const [outcome, setOutcome] = useState<Outcome>(null)
  const [msg, setMsg]         = useState('')
  const [error, setError]     = useState('')

  function deal() {
    const amt = parseFloat(stake)
    if (!user) { setError('Log in to play'); return }
    if (!amt || amt < 10) { setError('Min stake ₹10'); return }
    if (amt > balance) { setError('Insufficient balance'); return }
    setError('')
    const d = buildDeck()
    const p = [d[0], d[2]]
    const dl = [d[1], d[3]]
    const rest = d.slice(4)
    setDeck(rest); setPlayer(p); setDealer(dl); setPhase('playing'); setOutcome(null); setMsg('')
    setBalance(balance - amt)
    // Instant blackjack check
    if (handTotal(p) === 21) {
      setTimeout(() => endGame(p, dl, rest, true), 300)
    }
  }

  function hit() {
    const newCard = deck[0]
    const newDeck = deck.slice(1)
    const newPlayer = [...player, newCard]
    setPlayer(newPlayer)
    setDeck(newDeck)
    if (handTotal(newPlayer) > 21) {
      endGame(newPlayer, dealer, newDeck)
    }
  }

  function stand() {
    endGame(player, dealer, deck)
  }

  function double() {
    const amt = parseFloat(stake)
    if (amt > balance) { setError('Insufficient balance to double'); return }
    setBalance(balance - amt)
    const newCard = deck[0]
    const newDeck = deck.slice(1)
    const newPlayer = [...player, newCard]
    setPlayer(newPlayer)
    endGame(newPlayer, dealer, newDeck, false, true)
  }

  function endGame(pHand: Card[], dHand: Card[], remainingDeck: Card[], isBlackjack = false, isDouble = false) {
    let d = [...dHand]
    let dk = [...remainingDeck]
    // Dealer draws to 17+
    while (handTotal(d) < 17) {
      d = [...d, dk[0]]
      dk = dk.slice(1)
    }
    setDealer(d)
    setDeck(dk)
    setPhase('done')

    const pTotal = handTotal(pHand)
    const dTotal = handTotal(d)
    const amt = parseFloat(stake) * (isDouble ? 2 : 1)

    let result: Outcome
    let payout = 0

    if (pTotal > 21) {
      result = 'lose'; payout = 0
    } else if (isBlackjack && dTotal !== 21) {
      result = 'blackjack'; payout = amt * 2.5
    } else if (dTotal > 21) {
      result = 'win'; payout = amt * 2
    } else if (pTotal > dTotal) {
      result = 'win'; payout = amt * 2
    } else if (pTotal === dTotal) {
      result = 'push'; payout = amt
    } else {
      result = 'lose'; payout = 0
    }

    setOutcome(result)
    const labels = { win: '🎉 WIN', lose: '❌ LOSE', push: '🤝 PUSH', blackjack: '🃏 BLACKJACK!' }
    const payLabels = { win: `+₹${amt}`, lose: `-₹${amt}`, push: 'Bet returned', blackjack: `+₹${amt * 1.5}` }
    setMsg(`${labels[result!]} — ${payLabels[result!]}`)
    setBalance(prev => prev + payout)
  }

  const playerTotal = handTotal(player)
  const dealerTotal = phase === 'done' ? handTotal(dealer) : handTotal([dealer[0]])
  const bust = playerTotal > 21

  const outcomeColor = outcome === 'win' || outcome === 'blackjack'
    ? 'var(--accent)' : outcome === 'lose' ? 'var(--live-red)' : 'var(--accent-2)'

  return (
    <Layout hideSidebar>
      <Head><title>Blackjack — BetPro Casino</title></Head>
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>🃏 BLACKJACK</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>Beat the dealer to 21. Blackjack pays 3:2.</div>

        {/* Table */}
        <div style={{
          background: 'linear-gradient(160deg, #0a2a12 0%, #051a0a 100%)',
          border: '2px solid #1a4a20',
          borderRadius: 16, padding: '28px 24px', marginBottom: 20, minHeight: 300,
        }}>
          {/* Dealer hand */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
              DEALER {phase === 'done' ? `— ${dealerTotal}` : phase === 'playing' ? `— ${handTotal([dealer[0]])}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {dealer.map((c, i) => (
                <CardView key={i} card={c} hidden={i === 1 && phase === 'playing'} />
              ))}
            </div>
          </div>

          {/* Result overlay */}
          {outcome && (
            <div style={{ textAlign: 'center', margin: '8px 0 16px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: outcomeColor }}>
              {msg}
            </div>
          )}

          {/* Player hand */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
              YOU {player.length > 0 ? `— ${playerTotal}${bust ? ' (BUST)' : playerTotal === 21 ? ' (21!)' : ''}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {player.map((c, i) => <CardView key={i} card={c} />)}
              {player.length === 0 && (
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 14, paddingTop: 28 }}>Cards will appear here</div>
              )}
            </div>
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
                {[100,500,1000].map(v => (
                  <button key={v} onClick={() => setStake(String(v))} style={{ padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                    ₹{v>=1000?`${v/1000}k`:v}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={deal} disabled={!user} style={{
              padding: '11px 40px', background: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius)', border: 'none',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer', minWidth: 140,
            }}>DEAL</button>
          </div>
        )}

        {phase === 'playing' && (
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'HIT', fn: hit, color: 'var(--accent)' },
              { label: 'STAND', fn: stand, color: '#f0a500' },
              { label: 'DOUBLE', fn: double, color: '#8b5cf6', disabled: player.length > 2 },
            ].map(btn => (
              <button key={btn.label} onClick={btn.fn} disabled={btn.disabled} style={{
                flex: 1, padding: '14px', background: btn.disabled ? 'var(--bg-elevated)' : btn.color,
                color: btn.disabled ? 'var(--text-muted)' : '#000',
                borderRadius: 'var(--radius)', border: 'none',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                cursor: btn.disabled ? 'not-allowed' : 'pointer', letterSpacing: 0.5,
              }}>{btn.label}</button>
            ))}
          </div>
        )}

        {phase === 'done' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setPhase('idle'); setPlayer([]); setDealer([]) }} style={{
              flex: 1, padding: '14px', background: 'var(--accent)', color: '#000',
              borderRadius: 'var(--radius)', border: 'none',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer',
            }}>DEAL AGAIN</button>
          </div>
        )}

        {error && <div style={{ color: 'var(--live-red)', fontSize: 13, marginTop: 12 }}>{error}</div>}
      </div>
    </Layout>
  )
}
