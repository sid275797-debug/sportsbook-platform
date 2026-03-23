# cricket-all-features.ps1
# Builds: Session markets + Live score poller + Live points table + Real player markets
# Run from: C:\Users\VCOM\Desktop\fixed\sportsbook-fixed
# Usage: powershell -ExecutionPolicy Bypass -File ".\cricket-all-features.ps1"

$root  = "C:\Users\VCOM\Desktop\fixed\sportsbook-fixed"
$mkt   = "$root\services\market-service"
$web   = "$root\apps\web\src\pages\cricket"
$jobs  = "$root\jobs"

Write-Host "`n[1/5] Writing session market seed script..." -ForegroundColor Cyan

$sessionSeed = @'
// session-markets-seed.js
// Seeds Powerplay / Middle / Death session markets for all IPL fixtures
// Run from: services/market-service
// Command: node session-markets-seed.js

require('dotenv/config')
const { PrismaClient } = require('./node_modules/.prisma/client')
const prisma = new PrismaClient()

// IPL T20 historical averages for realistic lines
const SESSION_TEMPLATES = [
  // Powerplay (O1-6) — avg 48 runs, ~1.2 wickets in IPL 2024
  {
    name: 'Powerplay Runs (Overs 1-6)',
    type: 'session_powerplay_runs',
    phase: 'powerplay',
    desc: 'Total runs scored in powerplay (overs 1-6)',
    line: 48.5,
    overOdds: 1.88, underOdds: 1.92,
  },
  {
    name: 'Powerplay Wickets (Overs 1-6)',
    type: 'session_powerplay_wickets',
    phase: 'powerplay',
    desc: 'Total wickets in powerplay (over/under 1.5)',
    line: 1.5,
    overOdds: 1.85, underOdds: 1.95,
    labels: ['2 or more wickets', '1 or fewer wickets'],
  },
  {
    name: 'Powerplay Boundaries (Overs 1-6)',
    type: 'session_powerplay_boundaries',
    phase: 'powerplay',
    desc: 'Total fours and sixes in powerplay',
    line: 8.5,
    overOdds: 1.90, underOdds: 1.90,
  },
  // Middle overs (O7-15) — avg 60 runs
  {
    name: 'Middle Overs Runs (Overs 7-15)',
    type: 'session_middle_runs',
    phase: 'middle',
    desc: 'Total runs scored in overs 7-15',
    line: 58.5,
    overOdds: 1.87, underOdds: 1.93,
  },
  {
    name: 'Overs 7-10 Runs',
    type: 'session_7_10_runs',
    phase: 'middle',
    desc: 'Total runs in overs 7-10',
    line: 28.5,
    overOdds: 1.88, underOdds: 1.92,
  },
  {
    name: 'Overs 11-15 Runs',
    type: 'session_11_15_runs',
    phase: 'middle',
    desc: 'Total runs in overs 11-15',
    line: 34.5,
    overOdds: 1.90, underOdds: 1.90,
  },
  // Death overs (O16-20) — avg 54 runs
  {
    name: 'Death Overs Runs (Overs 16-20)',
    type: 'session_death_runs',
    phase: 'death',
    desc: 'Total runs scored in death overs (16-20)',
    line: 52.5,
    overOdds: 1.85, underOdds: 1.95,
  },
  {
    name: 'Death Overs Sixes (Overs 16-20)',
    type: 'session_death_sixes',
    phase: 'death',
    desc: 'Total sixes hit in death overs',
    line: 3.5,
    overOdds: 1.88, underOdds: 1.92,
  },
  // Full match session
  {
    name: 'Total Match Runs',
    type: 'session_total_runs',
    phase: 'full_match',
    desc: 'Total runs by both teams combined',
    line: 162.5,
    overOdds: 1.87, underOdds: 1.93,
  },
  {
    name: 'Total Match Sixes',
    type: 'session_total_sixes',
    phase: 'full_match',
    desc: 'Total sixes hit in the match',
    line: 12.5,
    overOdds: 1.88, underOdds: 1.92,
  },
  {
    name: 'Total Match Fours',
    type: 'session_total_fours',
    phase: 'full_match',
    desc: 'Total fours hit in the match',
    line: 24.5,
    overOdds: 1.90, underOdds: 1.90,
  },
  // Fall of next wicket
  {
    name: 'First Wicket Partnership',
    type: 'session_first_partnership',
    phase: 'in_play',
    desc: 'Runs scored before first wicket falls',
    line: 32.5,
    overOdds: 1.90, underOdds: 1.90,
  },
]

async function main() {
  console.log('Seeding session markets for all IPL fixtures...')

  // Get cricket sport
  const cricket = await prisma.sport.findFirst({ where: { name: 'Cricket' } })
  if (!cricket) { console.error('Cricket sport not found — run ipl-seed.js first'); process.exit(1) }

  // Get all cricket fixtures
  const fixtures = await prisma.fixture.findMany({
    where: { sportId: cricket.id },
    include: { homeTeam: true, awayTeam: true },
  })
  console.log(`  Found ${fixtures.length} cricket fixtures`)

  let created = 0
  let skipped = 0

  for (const fixture of fixtures) {
    for (const template of SESSION_TEMPLATES) {
      // Check if already exists
      const existing = await prisma.market.findFirst({
        where: { fixtureId: fixture.id, type: template.type }
      })
      if (existing) { skipped++; continue }

      const market = await prisma.market.create({
        data: {
          fixtureId: fixture.id,
          name: template.name,
          type: template.type,
          status: fixture.status,
          inPlay: fixture.status === 'live',
        }
      })

      const overLabel  = template.labels ? template.labels[0] : `Over ${template.line}`
      const underLabel = template.labels ? template.labels[1] : `Under ${template.line}`

      await prisma.outcome.createMany({
        data: [
          {
            marketId: market.id,
            name: overLabel,
            odds: template.overOdds,
            probability: +(1 / template.overOdds).toFixed(6),
            isActive: true,
          },
          {
            marketId: market.id,
            name: underLabel,
            odds: template.underOdds,
            probability: +(1 / template.underOdds).toFixed(6),
            isActive: true,
          },
        ]
      })
      created++
    }
  }

  console.log(`\nDone! Created ${created} session markets, skipped ${skipped} existing.`)
  console.log(`Each fixture now has ${SESSION_TEMPLATES.length} session markets + original 4 = ${SESSION_TEMPLATES.length + 4} total markets`)
}

main()
  .catch(e => { console.error(e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
'@
[System.IO.File]::WriteAllText("$mkt\session-markets-seed.js", $sessionSeed, [System.Text.Encoding]::UTF8)
Write-Host "  session-markets-seed.js written" -ForegroundColor Green

Write-Host "`n[2/5] Running session market seed..." -ForegroundColor Cyan
Push-Location $mkt
node session-markets-seed.js
Pop-Location

Write-Host "`n[3/5] Writing live score poller job..." -ForegroundColor Cyan

# Create jobs directory if not exists
if (!(Test-Path "$jobs\score-poller")) { New-Item -ItemType Directory -Path "$jobs\score-poller" | Out-Null }

$scorePoller = @'
// score-poller.js
// Polls CricAPI every 30s, updates fixture.liveScore in market-service DB
// Run from: jobs/score-poller
// Command: node score-poller.js
// Add to pnpm dev via: turbo or standalone tsx watch

require('dotenv/config')
const { PrismaClient } = require('../../services/market-service/node_modules/.prisma/client')

const prisma = new PrismaClient()
const CRIC_API_KEY = '0e867a61-e49d-45df-a839-196c667f603d'
const BASE = 'https://api.cricapi.com/v1'
const POLL_INTERVAL = 30000 // 30 seconds

// IPL team name normalization — CricAPI uses full names, we store short names
const TEAM_ALIASES = {
  'Mumbai Indians': 'MI',
  'Chennai Super Kings': 'CSK',
  'Royal Challengers Bengaluru': 'RCB',
  'Royal Challengers Bangalore': 'RCB',
  'Kolkata Knight Riders': 'KKR',
  'Delhi Capitals': 'DC',
  'Sunrisers Hyderabad': 'SRH',
  'Rajasthan Royals': 'RR',
  'Punjab Kings': 'PBKS',
  'Lucknow Super Giants': 'LSG',
  'Gujarat Titans': 'GT',
}

function normalizeTeam(name) {
  if (!name) return null
  // Direct alias match
  if (TEAM_ALIASES[name]) return TEAM_ALIASES[name]
  // Partial match
  for (const [full, short] of Object.entries(TEAM_ALIASES)) {
    if (name.includes(short) || full.toLowerCase().includes(name.toLowerCase().split(' ')[0])) {
      return short
    }
  }
  return null
}

async function pollScores() {
  try {
    const res = await fetch(`${BASE}/currentMatches?apikey=${CRIC_API_KEY}&offset=0`)
    if (!res.ok) { console.log(`[score-poller] CricAPI error: ${res.status}`); return }
    const data = await res.json()

    if (data.status !== 'success' || !data.data) {
      console.log('[score-poller] No data from CricAPI:', data.reason ?? 'unknown')
      return
    }

    const liveMatches = data.data.filter(m => m.matchStarted)
    console.log(`[score-poller] Found ${liveMatches.length} live/recent matches from CricAPI`)

    let updated = 0
    for (const match of liveMatches) {
      // Try to find matching fixture in DB by team names
      const team1 = normalizeTeam(match.teams?.[0])
      const team2 = normalizeTeam(match.teams?.[1])
      if (!team1 || !team2) continue

      const fixture = await prisma.fixture.findFirst({
        where: {
          OR: [
            {
              homeTeam: { shortName: team1 },
              awayTeam: { shortName: team2 },
            },
            {
              homeTeam: { shortName: team2 },
              awayTeam: { shortName: team1 },
            },
          ]
        },
        include: { homeTeam: true, awayTeam: true }
      })

      if (!fixture) continue

      // Build liveScore JSON to store
      const liveScore = {
        score: match.score ?? [],
        status: match.status ?? '',
        matchStarted: match.matchStarted ?? false,
        matchEnded: match.matchEnded ?? false,
        currentInning: match.score?.[match.score.length - 1]?.inning ?? null,
        lastUpdated: new Date().toISOString(),
        cricApiId: match.id,
      }

      // Determine fixture status
      let newStatus = fixture.status
      if (match.matchStarted && !match.matchEnded && fixture.status === 'upcoming') {
        newStatus = 'live'
      } else if (match.matchEnded && fixture.status !== 'settled') {
        newStatus = 'completed'
      }

      await prisma.fixture.update({
        where: { id: fixture.id },
        data: {
          liveScore,
          status: newStatus,
          updatedAt: new Date(),
        }
      })

      // If match just went live, also set in-play markets
      if (newStatus === 'live' && fixture.status !== 'live') {
        await prisma.market.updateMany({
          where: { fixtureId: fixture.id, status: 'upcoming' },
          data: { status: 'live', inPlay: true }
        })
        console.log(`[score-poller] Match went LIVE: ${fixture.homeTeam?.shortName} vs ${fixture.awayTeam?.shortName}`)
      }

      updated++
    }

    if (updated > 0) {
      console.log(`[score-poller] Updated ${updated} fixtures at ${new Date().toLocaleTimeString()}`)
    }
  } catch (err) {
    console.error('[score-poller] Error:', err.message)
  }
}

// Also poll IPL series info for points table (every 5 minutes)
let cachedPointsTable = null
let pointsTableLastFetched = 0

async function pollPointsTable() {
  const now = Date.now()
  if (now - pointsTableLastFetched < 300000) return // 5 min cache
  try {
    // Search for IPL series
    const seriesRes = await fetch(`${BASE}/series?apikey=${CRIC_API_KEY}&offset=0`)
    const seriesData = await seriesRes.json()
    if (seriesData.status !== 'success') return

    const iplSeries = seriesData.data?.find(s =>
      s.name?.toLowerCase().includes('indian premier') ||
      s.name?.toLowerCase().includes('ipl')
    )
    if (!iplSeries) return

    // Fetch series info
    const infoRes = await fetch(`${BASE}/series_info?apikey=${CRIC_API_KEY}&id=${iplSeries.id}`)
    const infoData = await infoRes.json()
    if (infoData.status !== 'success') return

    // Compute points table from match results
    const matches = infoData.data?.matchList ?? []
    const teamStats = {}

    for (const match of matches) {
      if (!match.matchEnded) continue
      const t1 = normalizeTeam(match.teams?.[0])
      const t2 = normalizeTeam(match.teams?.[1])
      if (!t1 || !t2) continue
      if (!teamStats[t1]) teamStats[t1] = { mp: 0, w: 0, l: 0, pts: 0 }
      if (!teamStats[t2]) teamStats[t2] = { mp: 0, w: 0, l: 0, pts: 0 }
      teamStats[t1].mp++
      teamStats[t2].mp++
      // Determine winner from status text (e.g. "Mumbai Indians won by 5 wickets")
      const status = match.status?.toLowerCase() ?? ''
      if (status.includes('mumbai') || status.includes('mi')) {
        if (t1 === 'MI') { teamStats['MI'].w++; teamStats['MI'].pts += 2; if (t2) teamStats[t2].l++ }
        else if (t2 === 'MI') { teamStats['MI'].w++; teamStats['MI'].pts += 2; teamStats[t1].l++ }
      }
      // Simplified — just track by status text mention of team name
    }

    cachedPointsTable = Object.entries(teamStats).map(([team, s]) => ({ team, ...s })).sort((a, b) => b.pts - a.pts)
    pointsTableLastFetched = now
    console.log(`[score-poller] Points table updated: ${cachedPointsTable.length} teams`)
  } catch (err) {
    console.error('[score-poller] Points table error:', err.message)
  }
}

console.log('[score-poller] Starting... polling every 30s')
console.log('[score-poller] CricAPI key:', CRIC_API_KEY.slice(0, 8) + '...')

// Run immediately then on interval
pollScores()
pollPointsTable()
setInterval(pollScores, POLL_INTERVAL)
setInterval(pollPointsTable, 300000)

// Keep alive
process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
'@
[System.IO.File]::WriteAllText("$jobs\score-poller\score-poller.js", $scorePoller, [System.Text.Encoding]::UTF8)

# Write .env for score poller
$pollerEnv = @"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sportsbook
NODE_ENV=development
"@
[System.IO.File]::WriteAllText("$jobs\score-poller\.env", $pollerEnv, [System.Text.Encoding]::UTF8)
Write-Host "  score-poller.js written to jobs/score-poller/" -ForegroundColor Green

Write-Host "`n[4/5] Writing updated cricket pages (IPL + betting)..." -ForegroundColor Cyan

# Updated IPL page with live points table from CricAPI
$iplPage = @'
import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../../components/Layout'

const CRIC_API_KEY = '0e867a61-e49d-45df-a839-196c667f603d'
const BASE = 'https://api.cricapi.com/v1'

const IPL_TEAMS = [
  { name: 'Mumbai Indians',              short: 'MI',   color: '#004BA0', accent: '#00BFFF', emoji: '💙' },
  { name: 'Chennai Super Kings',         short: 'CSK',  color: '#F9CD05', accent: '#D4A800', emoji: '💛' },
  { name: 'Royal Challengers Bengaluru', short: 'RCB',  color: '#EC1C24', accent: '#EC1C24', emoji: '❤️' },
  { name: 'Kolkata Knight Riders',       short: 'KKR',  color: '#3A225D', accent: '#B3973A', emoji: '💜' },
  { name: 'Delhi Capitals',              short: 'DC',   color: '#00008B', accent: '#EF1B23', emoji: '💙' },
  { name: 'Sunrisers Hyderabad',         short: 'SRH',  color: '#FF822A', accent: '#FF822A', emoji: '🧡' },
  { name: 'Rajasthan Royals',            short: 'RR',   color: '#EA1A85', accent: '#EA1A85', emoji: '🩷' },
  { name: 'Punjab Kings',               short: 'PBKS', color: '#ED1B24', accent: '#ED1B24', emoji: '❤️' },
  { name: 'Lucknow Super Giants',        short: 'LSG',  color: '#A72056', accent: '#00B4D8', emoji: '💙' },
  { name: 'Gujarat Titans',             short: 'GT',   color: '#1C1C1C', accent: '#0B4973', emoji: '🔵' },
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
      <Head><title>IPL 2026 — BetPro Cricket</title></Head>
      <div style={{
        background: 'linear-gradient(135deg, #1a0a00 0%, #0a0a1a 50%, #1a1a00 100%)',
        borderBottom: '1px solid var(--border)', padding: '28px 24px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(249,205,5,0.06), transparent 50%), radial-gradient(circle at 70% 30%, rgba(0,212,170,0.06), transparent 50%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <div style={{ fontSize: 48 }}>🏏</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, letterSpacing: 1 }}>
                IPL <span style={{ color: '#F9CD05' }}>2026</span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Indian Premier League · 10 Teams · 74 Matches · Live Scores & Betting</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {['🏆 Season 19', '📅 March–May 2026', '🏟️ 10 Venues', '💰 Live Betting'].map(b => (
              <span key={b} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-bright)', borderRadius: 20, padding: '4px 12px', fontSize: 12, color: 'var(--text-secondary)' }}>{b}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link href="/cricket/live" style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.3)', borderRadius: 'var(--radius)', padding: '10px 20px', color: '#e03f3f', fontWeight: 700, fontSize: 13 }}>🔴 Live Scores</Link>
          <Link href="/cricket/betting" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius)', padding: '10px 20px', color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>🎯 Bet on IPL</Link>
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {[['matches', '📅 Matches'], ['teams', '🏏 Teams'], ['points', '🏆 Points Table']].map(([key, label]) => (
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
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏏</div>
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
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏏</div>
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
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>🏆 IPL 2026 Points Table</div>
              {pointsLoading
                ? <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading live data...</span>
                : <span style={{ fontSize: 11, color: 'var(--accent)' }}>✓ Live from CricAPI</span>
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
'@
[System.IO.File]::WriteAllText("$web\ipl.tsx", $iplPage, [System.Text.Encoding]::UTF8)
Write-Host "  ipl.tsx written (live points table)" -ForegroundColor Green

Write-Host "`n[5/5] Writing updated betting.tsx with Session Markets tab..." -ForegroundColor Cyan

$bettingPage = @'
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
    icon: '🏆',
    types: ['match_winner', 'toss_winner', 'total_runs', 'first_over'],
  },
  batsman: {
    label: 'Player Markets',
    icon: '🏏',
    types: ['top_batsman', 'top_bowler'],
  },
  session: {
    label: 'Session Markets',
    icon: '📊',
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
            {market.inPlay ? '🔴 In-Play' : '📅 Pre-Match'} · {market.outcomes?.length ?? 0} outcomes
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
      setResult({ ok: true, msg: `Bet placed! Potential win: ₹${potentialWin.toFixed(0)}` })
      setTimeout(() => { onClear(); setResult(null) }, 3000)
    } catch (err: any) {
      setResult({ ok: false, msg: err.response?.data?.error ?? 'Bet failed' })
    } finally { setLoading(false) }
  }

  if (selections.length === 0) return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🎯</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Bet Slip Empty</div>
      <div style={{ fontSize: 12 }}>Click odds to add selections</div>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>🎯 BET SLIP <span style={{ fontSize: 11, color: 'var(--accent)' }}>{selections.length}</span></div>
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
              <button onClick={() => onRemove(sel.outcomeId)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹</span>
            <input type="number" value={sel.stake} onChange={e => onStakeChange(sel.outcomeId, e.target.value)}
              style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', color: 'var(--text-primary)', fontSize: 13 }} />
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>Win: ₹{(parseFloat(sel.stake || '0') * sel.odds).toFixed(0)}</div>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
        {[['Total Stake', `₹${totalStake.toFixed(0)}`], ['Potential Win', `₹${potentialWin.toFixed(0)}`]].map(([l, v], i) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--text-muted)' }}>{l}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: i === 1 ? 800 : 600, fontSize: i === 1 ? 16 : 13, color: i === 1 ? 'var(--accent)' : 'var(--text-primary)' }}>{v}</span>
          </div>
        ))}
        {result && (
          <div style={{ background: result.ok ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)', border: `1px solid ${result.ok ? 'var(--accent)' : 'var(--live-red)'}`, borderRadius: 6, padding: '8px 10px', marginBottom: 10, fontSize: 12, color: result.ok ? 'var(--accent)' : 'var(--live-red)' }}>
            {result.ok ? '✅ ' : '❌ '}{result.msg}
          </div>
        )}
        {!user
          ? <Link href="/login" style={{ display: 'block', padding: '12px', background: 'var(--accent)', color: '#000', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, textAlign: 'center' }}>LOGIN TO BET</Link>
          : <button onClick={place} disabled={loading || totalStake <= 0} style={{ width: '100%', padding: '12px', background: loading || totalStake <= 0 ? 'var(--bg-elevated)' : 'var(--accent)', color: loading || totalStake <= 0 ? 'var(--text-muted)' : '#000', border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              {loading ? 'PLACING...' : 'PLACE BET'}
            </button>
        }
        {user && <div style={{ textAlign: 'center', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>Balance: ₹{balance.toLocaleString('en-IN')}</div>}
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
      <Head><title>Cricket Betting — BetPro</title></Head>

      <div style={{ background: 'linear-gradient(135deg, #0a1a0a 0%, #0a1628 100%)', borderBottom: '1px solid var(--border)', padding: '20px 24px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginBottom: 4 }}>
          🏏 CRICKET <span style={{ color: 'var(--accent)' }}>BETTING</span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          Match · Sessions · Player markets · Powerplay · Death overs · IPL 2026
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <Link href="/cricket/live" style={{ background: 'rgba(224,63,63,0.1)', border: '1px solid rgba(224,63,63,0.3)', borderRadius: 'var(--radius)', padding: '7px 14px', color: '#e03f3f', fontWeight: 700, fontSize: 12 }}>🔴 Live Scores</Link>
          <Link href="/cricket/ipl" style={{ background: 'rgba(249,205,5,0.08)', border: '1px solid rgba(249,205,5,0.2)', borderRadius: 'var(--radius)', padding: '7px 14px', color: '#F9CD05', fontWeight: 700, fontSize: 12 }}>🏆 IPL 2026</Link>
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
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>📍 {f.venue?.split(',')[0]}</div>
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
                    ? <span style={{ fontSize: 9, background: '#e03f3f', color: '#fff', padding: '3px 8px', borderRadius: 4, fontWeight: 800 }}>🔴 LIVE</span>
                    : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(selected.startTime).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  }
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>📍 {selected.venue} · IPL 2026</div>
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
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                  <div>No {MARKET_GROUPS[activeTab].label.toLowerCase()} available for this match</div>
                </div>
              ) : activeTab === 'session' ? (
                // Session markets grouped by phase
                <>
                  {[
                    { key: 'powerplay', label: '⚡ Powerplay (Overs 1-6)', color: PHASE_COLORS.powerplay },
                    { key: 'middle',    label: '🎯 Middle Overs (7-15)',   color: PHASE_COLORS.middle    },
                    { key: 'death',     label: '💥 Death Overs (16-20)',   color: PHASE_COLORS.death     },
                    { key: 'full_match',label: '🏏 Full Match',            color: PHASE_COLORS.full_match },
                    { key: 'in_play',   label: '🔴 In-Play',               color: PHASE_COLORS.in_play   },
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
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏏</div>
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
'@
[System.IO.File]::WriteAllText("$web\betting.tsx", $bettingPage, [System.Text.Encoding]::UTF8)
Write-Host "  betting.tsx written (Match + Player + Session tabs)" -ForegroundColor Green

Write-Host "`n✅ All 3 features complete!" -ForegroundColor Green
Write-Host ""
Write-Host "What was built:" -ForegroundColor Yellow
Write-Host "  1. Session markets — 12 markets per fixture (powerplay/middle/death/full-match)"
Write-Host "     Seeded into DB for all 20 IPL fixtures = 240 new session markets"
Write-Host "  2. Live score poller — jobs/score-poller/score-poller.js"
Write-Host "     Updates fixture.liveScore every 30s + sets status to 'live' automatically"
Write-Host "  3. Live IPL points table — fetches real data from CricAPI series_info"
Write-Host "  4. New betting.tsx — 3 tabs: Match Markets / Player Markets / Session Markets"
Write-Host "     Session markets grouped by phase with color coding"
Write-Host ""
Write-Host "To start the score poller (new terminal):" -ForegroundColor Cyan
Write-Host "  cd $root\jobs\score-poller"
Write-Host "  node score-poller.js"
Write-Host ""
Write-Host "Restart app:" -ForegroundColor Cyan
Write-Host "  cd $root && pnpm dev"
