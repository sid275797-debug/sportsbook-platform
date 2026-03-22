import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Layout from '../components/Layout'
import { casinoApi } from '../lib/api'
import { useAuthStore } from '../store'

interface CrashRound { id: string; multiplier: number; endedAt: string }

export default function Casino() {
  return (
    <Layout>
      <Head><title>Casino — BetPro</title></Head>
      <div className="fade-up" style={{ padding: '0 0 40px' }}>
        <CasinoHero />
        <div style={{ padding: '24px 20px' }}>
          <GameGrid />
          <CrashSection />
        </div>
      </div>
    </Layout>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function CasinoHero() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a0a2e 0%, #0a1628 50%, #0a1a14 100%)',
      borderBottom: '1px solid var(--border)',
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(240,165,0,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,212,170,0.06) 0%, transparent 50%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 36,
          letterSpacing: 1,
          color: 'var(--text-primary)',
          marginBottom: 8,
        }}>
          🎰 BETPRO <span style={{ color: 'var(--accent-2)' }}>CASINO</span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 480 }}>
          Provably fair games. Instant payouts. All games use cryptographically verified RNG.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          {['🔐 Provably Fair', '⚡ Instant Payouts', '🎁 Daily Bonuses', '💬 Live Support'].map(b => (
            <span key={b} style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-bright)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Game Grid ────────────────────────────────────────────────────────────────

const GAMES = [
  {
    slug: 'crash',
    name: 'Crash',
    emoji: '🚀',
    desc: 'Watch the multiplier grow and cash out before it crashes. Up to 1000x.',
    tag: 'HOT',
    tagColor: '#e03f3f',
    gradient: ['#2d0a0a', '#1a0505'],
    accent: '#e03f3f',
    players: 2847,
  },
  {
    slug: 'dice',
    name: 'Dice',
    emoji: '🎲',
    desc: 'Set your target. Roll the dice. Adjust risk with custom win probability.',
    tag: 'POPULAR',
    tagColor: '#f0a500',
    gradient: ['#2d1a00', '#1a0f00'],
    accent: '#f0a500',
    players: 1203,
  },
  {
    slug: 'roulette',
    name: 'Roulette',
    emoji: '🎡',
    desc: 'Classic European roulette. Red, black, numbers, dozens — your call.',
    tag: 'CLASSIC',
    tagColor: '#00d4aa',
    gradient: ['#001a14', '#000f0c'],
    accent: '#00d4aa',
    players: 876,
  },
  {
    slug: 'blackjack',
    name: 'Blackjack',
    emoji: '🃏',
    desc: 'Beat the dealer to 21. Hit, stand, double, split — full classic rules.',
    tag: 'SKILL',
    tagColor: '#8b5cf6',
    gradient: ['#0d0a1a', '#080612'],
    accent: '#8b5cf6',
    players: 634,
  },
  {
    slug: 'plinko',
    name: 'Plinko',
    emoji: '📌',
    desc: 'Drop the ball. Watch it bounce through pegs to your multiplier.',
    tag: 'NEW',
    tagColor: '#3b82f6',
    gradient: ['#000d1a', '#000812'],
    accent: '#3b82f6',
    players: 421,
  },
  {
    slug: 'andar-bahar',
    name: 'Andar Bahar',
    emoji: '🎴',
    desc: 'Classic Indian card game. Pick Andar or Bahar — which side gets the match?',
    tag: 'INDIA',
    tagColor: '#f0a500',
    gradient: ['#1a0a00', '#120700'],
    accent: '#f0a500',
    players: 1205,
  },
  {
    slug: 'teen-patti',
    name: 'Teen Patti',
    emoji: '🎴',
    desc: '3-card Indian poker. Trials, sequences, pairs — beat the dealer!',
    tag: 'INDIA',
    tagColor: '#f0a500',
    gradient: ['#1a001a', '#120012'],
    accent: '#c084fc',
    players: 2341,
  },
  {
    slug: 'baccarat',
    name: 'Baccarat',
    emoji: '🎰',
    desc: 'Punto Banco — bet on Player, Banker or Tie. Closest to 9 wins!',
    tag: 'VIP',
    tagColor: '#22c55e',
    gradient: ['#001a0d', '#001208'],
    accent: '#22c55e',
    players: 876,
  },
]

function GameGrid() {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700, fontSize: 20, letterSpacing: 0.5,
        marginBottom: 16,
      }}>GAMES</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {GAMES.map(g => (
          <Link key={g.slug} href={`/casino/${g.slug}`} style={{
            background: `linear-gradient(145deg, ${g.gradient[0]} 0%, ${g.gradient[1]} 100%)`,
            border: `1px solid ${g.accent}30`,
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            transition: 'all 0.2s',
            position: 'relative',
            overflow: 'hidden',
          }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = g.accent + '80'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = g.accent + '30'
              ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
            }}
          >
            {/* Tag */}
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: g.tagColor,
              color: '#000',
              fontSize: 9, fontWeight: 800, letterSpacing: 1,
              padding: '2px 7px', borderRadius: 3,
            }}>{g.tag}</div>

            <div style={{ fontSize: 40 }}>{g.emoji}</div>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 20, color: 'var(--text-primary)',
            }}>{g.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {g.desc}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: g.accent,
                boxShadow: `0 0 6px ${g.accent}`,
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {g.players.toLocaleString()} playing now
              </span>
            </div>
            <div style={{
              marginTop: 8,
              background: g.accent,
              color: '#000',
              padding: '8px 0',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 0.5,
            }}>PLAY NOW →</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

// ─── Crash Live Feed ──────────────────────────────────────────────────────────

function CrashSection() {
  const [history, setHistory] = useState<CrashRound[]>([])
  const { user } = useAuthStore()

  useEffect(() => {
    casinoApi.crashHistory().then(r => setHistory(r.data.data ?? [])).catch(() => {})
  }, [])

  return (
    <section>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700, fontSize: 20, letterSpacing: 0.5,
        marginBottom: 16,
      }}>🚀 CRASH — RECENT ROUNDS</div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}>
          <span>#</span><span style={{ textAlign: 'center' }}>Multiplier</span><span style={{ textAlign: 'right' }}>Time</span>
        </div>

        {history.length === 0 ? (
          [10.24, 1.32, 5.67, 2.01, 87.54, 1.05, 3.44, 14.22, 1.88, 6.90].map((m, i) => (
            <CrashRow key={i} index={i + 1} multiplier={m} time="--:--" />
          ))
        ) : (
          history.slice(0, 10).map((r, i) => (
            <CrashRow
              key={r.id}
              index={i + 1}
              multiplier={r.multiplier}
              time={new Date(r.endedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            />
          ))
        )}

        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link href="/casino/crash" style={{
            color: 'var(--accent)', fontSize: 13, fontWeight: 600,
          }}>View full history & play →</Link>
        </div>
      </div>

      {/* Indian Games Highlight */}
      <div style={{ marginTop: 32 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700, fontSize: 20, letterSpacing: 0.5,
          marginBottom: 16,
        }}>🇮🇳 INDIAN GAMES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {[
            { slug: 'andar-bahar', name: 'Andar Bahar', emoji: '🎴', desc: 'Pick a side — Andar or Bahar. Fastest card game in India!', color: '#f0a500' },
            { slug: 'teen-patti', name: 'Teen Patti', emoji: '🎴', desc: '3-card poker beloved across India. Trial, Sequence, Pair!', color: '#c084fc' },
            { slug: 'baccarat', name: 'Baccarat', emoji: '🎰', desc: 'Classic high-roller game. Player vs Banker — pick your side!', color: '#22c55e' },
          ].map(g => (
            <Link key={g.slug} href={`/casino/${g.slug}`} style={{
              background: 'var(--bg-card)',
              border: `1px solid ${g.color}30`,
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              display: 'flex', gap: 16, alignItems: 'center',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = g.color + '80' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = g.color + '30' }}
            >
              <div style={{ fontSize: 44, flexShrink: 0 }}>{g.emoji}</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: g.color, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{g.desc}</div>
                <div style={{ fontSize: 12, color: g.color, fontWeight: 700, marginTop: 8 }}>PLAY NOW →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CrashRow({ index, multiplier, time }: { index: number; multiplier: number; time: string }) {
  const isCrash = multiplier < 2
  const isEpic  = multiplier >= 10
  const color = isCrash ? 'var(--live-red)' : isEpic ? 'var(--accent-2)' : 'var(--accent)'
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      padding: '10px 20px',
      borderBottom: '1px solid var(--border)',
      fontSize: 13,
    }}>
      <span style={{ color: 'var(--text-muted)' }}>#{index}</span>
      <span style={{
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color,
        fontSize: 15,
      }}>
        {multiplier.toFixed(2)}×
      </span>
      <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>{time}</span>
    </div>
  )
}
