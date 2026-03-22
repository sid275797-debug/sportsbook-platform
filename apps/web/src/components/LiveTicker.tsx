import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fixturesApi } from '../lib/api'

interface LiveFixture {
  id: string
  homeTeam: { name: string; shortName?: string }
  awayTeam: { name: string; shortName?: string }
  sport: { slug: string }
  liveScore?: { homeScore: number; awayScore: number; minute?: number }
}

const SPORT_EMOJI: Record<string, string> = {
  cricket: '🏏', football: '⚽', tennis: '🎾', basketball: '🏀',
}

export default function LiveTicker() {
  const [fixtures, setFixtures] = useState<LiveFixture[]>([])

  useEffect(() => {
    const load = () => {
      fixturesApi.live().then(r => setFixtures(r.data.data ?? [])).catch(() => {})
    }
    load()
    const t = setInterval(load, 30_000)
    return () => clearInterval(t)
  }, [])

  if (fixtures.length === 0) return null

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      height: 36,
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* LIVE label */}
      <div style={{
        background: 'var(--live-red)',
        color: '#fff',
        padding: '0 12px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 12,
        letterSpacing: 1,
        flexShrink: 0,
      }}>
        <span className="live-dot" style={{ background: '#fff' }} />
        LIVE
      </div>

      {/* Scrolling ticker */}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'flex',
          gap: 0,
          animation: 'ticker 30s linear infinite',
          width: 'max-content',
        }}>
          {[...fixtures, ...fixtures].map((f, i) => (
            <Link key={`${f.id}-${i}`} href={`/fixture/${f.id}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 20px',
              height: 36,
              borderRight: '1px solid var(--border)',
              whiteSpace: 'nowrap',
              fontSize: 12,
              color: 'var(--text-secondary)',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}>
              <span>{SPORT_EMOJI[f.sport?.slug] ?? '🏟️'}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {f.homeTeam?.shortName ?? f.homeTeam?.name}
              </span>
              {f.liveScore && (
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                  {f.liveScore.homeScore}–{f.liveScore.awayScore}
                </span>
              )}
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {f.awayTeam?.shortName ?? f.awayTeam?.name}
              </span>
              {f.liveScore?.minute && (
                <span style={{ color: 'var(--live-red)', fontSize: 10, fontWeight: 700 }}>
                  {f.liveScore.minute}'
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
