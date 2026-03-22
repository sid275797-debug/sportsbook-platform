import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'

type Side = 'andar' | 'bahar' | null
type Phase = 'idle' | 'betting' | 'dealing' | 'done'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
const RED_SUITS = ['♥', '♦']

interface Card { rank: string; suit: string }

function randomCard(): Card {
  return {
    rank: RANKS[Math.floor(Math.random() * RANKS.length)],
    suit: SUITS[Math.floor(Math.random() * SUITS.length)],
  }
}

function CardView({ card, hidden, small }: { card?: Card; hidden?: boolean; small?: boolean }) {
  const isRed = card && RED_SUITS.includes(card.suit)
  const size = small ? { width: 44, height: 64, fontSize: 14 } : { width: 60, height: 88, fontSize: 18 }
  return (
    <div style={{
      ...size,
      borderRadius: 8,
      background: hidden ? '#1e2533' : '#fff',
      border: `2px solid ${hidden ? '#2e3a4e' : '#ccc'}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, color: hidden ? '#555' : (isRed ? '#e03f3f' : '#0a0c0f'),
      flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      transition: 'all 0.3s',
    }}>
      {hidden ? '?' : <><div>{card!.suit}</div><div style={{ fontSize: (small ? 12 : 16) }}>{card!.rank}</div></>}
    </div>
  )
}

export default function AndarBaharPage() {
  const { user, balance, setBalance } = useAuthStore()
  const [stake, setStake] = useState('100')
  const [side, setSide] = useState<Side>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [joker, setJoker] = useState<Card | null>(null)
  const [andarCards, setAndarCards] = useState<Card[]>([])
  const [baharCards, setBaharCards] = useState<Card[]>([])
  const [won, setWon] = useState<boolean | null>(null)
  const [payout, setPayout] = useState(0)
  const [msg, setMsg] = useState('')
  const [history, setHistory] = useState<Array<{ side: string; won: boolean; payout: number }>>([])
  const [error, setError] = useState('')
  const [dealIdx, setDealIdx] = useState(0)

  function startGame() {
    const amt = parseFloat(stake)
    if (!user) { setError('Log in to play'); return }
    if (!side) { setError('Choose Andar or Bahar first'); return }
    if (!amt || amt < 10) { setError('Min stake ₹10'); return }
    if (amt > balance) { setError('Insufficient balance'); return }
    setError('')
    setBalance(balance - amt)
    setAndarCards([])
    setBaharCards([])
    setWon(null)
    setMsg('')
    setDealIdx(0)
    // Draw joker card
    const j = randomCard()
    setJoker(j)
    setPhase('dealing')
  }

  // Auto-deal cards one by one
  useEffect(() => {
    if (phase !== 'dealing' || !joker) return
    if (dealIdx > 40) {
      // Safety — force end if no match
      settle(andarCards, baharCards, false)
      return
    }

    const timer = setTimeout(() => {
      const newCard = randomCard()
      // Deal alternately: first to Andar, then Bahar
      const isAndar = dealIdx % 2 === 0
      let newAndar = andarCards
      let newBahar = baharCards

      if (isAndar) {
        newAndar = [...andarCards, newCard]
        setAndarCards(newAndar)
      } else {
        newBahar = [...baharCards, newCard]
        setBaharCards(newBahar)
      }

      // Check if this card matches joker rank
      if (newCard.rank === joker.rank) {
        const winningSide: Side = isAndar ? 'andar' : 'bahar'
        settle(newAndar, newBahar, winningSide === side)
      } else {
        setDealIdx(dealIdx + 1)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [phase, dealIdx, joker])

  function settle(finalAndar: Card[], finalBahar: Card[], playerWon: boolean) {
    const amt = parseFloat(stake)
    const p = playerWon ? amt * 1.9 : 0 // 1.9x payout (5% house edge)
    setWon(playerWon)
    setPayout(p)
    setMsg(playerWon ? `🎉 YOU WIN ₹${p.toFixed(0)}!` : '❌ YOU LOSE')
    if (playerWon) setBalance(prev => prev + p)
    setHistory(prev => [{ side: side!, won: playerWon, payout: p }, ...prev.slice(0, 19)])
    setPhase('done')
  }

  function reset() {
    setPhase('idle')
    setSide(null)
    setJoker(null)
    setAndarCards([])
    setBaharCards([])
    setWon(null)
    setMsg('')
  }

  return (
    <Layout hideSidebar>
      <Head><title>Andar Bahar — BetPro Casino</title></Head>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>
          🎴 ANDAR BAHAR
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
          Classic Indian card game. Guess which side gets the matching card!
        </div>

        {/* Result banner */}
        {phase === 'done' && (
          <div style={{
            background: won ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)',
            border: `1px solid ${won ? 'var(--accent)' : 'var(--live-red)'}`,
            borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 20,
            textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: 22, color: won ? 'var(--accent)' : 'var(--live-red)',
          }}>{msg}</div>
        )}

        {/* Game table */}
        <div style={{
          background: 'linear-gradient(160deg, #0a2a12 0%, #051a0a 100%)',
          border: '2px solid #1a4a20', borderRadius: 16, padding: 24, marginBottom: 20,
        }}>
          {/* Joker card */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 10 }}>
              JOKER CARD {joker ? '— Match this rank!' : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {joker ? <CardView card={joker} /> : <CardView hidden />}
            </div>
          </div>

          {/* Two sides */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Andar */}
            <div style={{
              background: side === 'andar' && phase === 'idle' ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${side === 'andar' ? 'var(--accent)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--accent)', marginBottom: 12, textAlign: 'center' }}>
                ANDAR (Inside)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 70, alignItems: 'center', justifyContent: 'center' }}>
                {andarCards.length === 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>No cards yet</span>}
                {andarCards.map((c, i) => (
                  <CardView key={i} card={c} small />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {andarCards.length} cards
              </div>
            </div>

            {/* Bahar */}
            <div style={{
              background: side === 'bahar' && phase === 'idle' ? 'rgba(240,165,0,0.1)' : 'rgba(255,255,255,0.03)',
              border: `2px solid ${side === 'bahar' ? '#f0a500' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#f0a500', marginBottom: 12, textAlign: 'center' }}>
                BAHAR (Outside)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minHeight: 70, alignItems: 'center', justifyContent: 'center' }}>
                {baharCards.length === 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>No cards yet</span>}
                {baharCards.map((c, i) => (
                  <CardView key={i} card={c} small />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                {baharCards.length} cards
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        {phase === 'idle' && (
          <>
            {/* Side selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <button onClick={() => setSide('andar')} style={{
                padding: '18px', borderRadius: 'var(--radius)', border: `2px solid ${side === 'andar' ? 'var(--accent)' : 'var(--border)'}`,
                background: side === 'andar' ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                color: side === 'andar' ? 'var(--accent)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, cursor: 'pointer',
              }}>
                ANDAR
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4, opacity: 0.7 }}>Pays 1.9×</div>
              </button>
              <button onClick={() => setSide('bahar')} style={{
                padding: '18px', borderRadius: 'var(--radius)', border: `2px solid ${side === 'bahar' ? '#f0a500' : 'var(--border)'}`,
                background: side === 'bahar' ? 'rgba(240,165,0,0.1)' : 'var(--bg-elevated)',
                color: side === 'bahar' ? '#f0a500' : 'var(--text-secondary)',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, cursor: 'pointer',
              }}>
                BAHAR
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', marginTop: 4, opacity: 0.7 }}>Pays 1.9×</div>
              </button>
            </div>

            {/* Stake */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
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
              <button onClick={startGame} disabled={!side} style={{
                padding: '11px 32px', background: side ? 'var(--accent)' : 'var(--bg-elevated)',
                color: side ? '#000' : 'var(--text-muted)', borderRadius: 'var(--radius)', border: 'none',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: side ? 'pointer' : 'not-allowed', minWidth: 140,
              }}>DEAL</button>
            </div>
          </>
        )}

        {phase === 'dealing' && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
            🎴 Dealing cards...
          </div>
        )}

        {phase === 'done' && (
          <button onClick={reset} style={{
            width: '100%', padding: '14px', background: 'var(--accent)', color: '#000',
            borderRadius: 'var(--radius)', border: 'none', fontFamily: 'var(--font-display)',
            fontWeight: 800, fontSize: 16, cursor: 'pointer',
          }}>PLAY AGAIN</button>
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
                  background: h.won ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)',
                  color: h.won ? 'var(--accent)' : 'var(--live-red)',
                }}>{h.side.toUpperCase()} {h.won ? '✓' : '✗'}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
