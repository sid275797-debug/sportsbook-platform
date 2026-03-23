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

// IPL team name normalization â€” CricAPI uses full names, we store short names
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
      // Simplified â€” just track by status text mention of team name
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