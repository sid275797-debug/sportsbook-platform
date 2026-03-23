// ipl-seed.js
// Run from: services\market-service
// Command: node ipl-seed.js

require('dotenv/config')
const { PrismaClient } = require('./node_modules/.prisma/client')
const prisma = new PrismaClient()

const IPL_TEAMS = [
  { name: 'Mumbai Indians',              short: 'MI'   },
  { name: 'Chennai Super Kings',         short: 'CSK'  },
  { name: 'Royal Challengers Bengaluru', short: 'RCB'  },
  { name: 'Kolkata Knight Riders',       short: 'KKR'  },
  { name: 'Delhi Capitals',              short: 'DC'   },
  { name: 'Sunrisers Hyderabad',         short: 'SRH'  },
  { name: 'Rajasthan Royals',            short: 'RR'   },
  { name: 'Punjab Kings',                short: 'PBKS' },
  { name: 'Lucknow Super Giants',        short: 'LSG'  },
  { name: 'Gujarat Titans',              short: 'GT'   },
]

// IPL 2026 schedule - first 20 matches
const SCHEDULE = [
  { home: 'MI',   away: 'CSK',  date: '2026-03-22T14:00:00Z', venue: 'Wankhede Stadium, Mumbai',              status: 'live'     },
  { home: 'RCB',  away: 'KKR',  date: '2026-03-23T10:00:00Z', venue: 'M. Chinnaswamy Stadium, Bengaluru',     status: 'upcoming' },
  { home: 'SRH',  away: 'DC',   date: '2026-03-23T14:00:00Z', venue: 'Rajiv Gandhi IS, Hyderabad',            status: 'upcoming' },
  { home: 'RR',   away: 'PBKS', date: '2026-03-24T14:00:00Z', venue: 'Sawai Mansingh Stadium, Jaipur',        status: 'upcoming' },
  { home: 'GT',   away: 'LSG',  date: '2026-03-25T14:00:00Z', venue: 'Narendra Modi Stadium, Ahmedabad',      status: 'upcoming' },
  { home: 'CSK',  away: 'RCB',  date: '2026-03-26T14:00:00Z', venue: 'MA Chidambaram Stadium, Chennai',       status: 'upcoming' },
  { home: 'KKR',  away: 'MI',   date: '2026-03-27T14:00:00Z', venue: 'Eden Gardens, Kolkata',                 status: 'upcoming' },
  { home: 'DC',   away: 'RR',   date: '2026-03-28T14:00:00Z', venue: 'Arun Jaitley Stadium, Delhi',           status: 'upcoming' },
  { home: 'PBKS', away: 'SRH',  date: '2026-03-29T14:00:00Z', venue: 'Punjab Cricket Association IS, Mohali', status: 'upcoming' },
  { home: 'LSG',  away: 'GT',   date: '2026-03-30T14:00:00Z', venue: 'BRSABV Ekana Cricket Stadium, Lucknow', status: 'upcoming' },
  { home: 'MI',   away: 'RCB',  date: '2026-03-31T14:00:00Z', venue: 'Wankhede Stadium, Mumbai',              status: 'upcoming' },
  { home: 'CSK',  away: 'KKR',  date: '2026-04-01T14:00:00Z', venue: 'MA Chidambaram Stadium, Chennai',       status: 'upcoming' },
  { home: 'SRH',  away: 'RR',   date: '2026-04-02T14:00:00Z', venue: 'Rajiv Gandhi IS, Hyderabad',            status: 'upcoming' },
  { home: 'DC',   away: 'PBKS', date: '2026-04-03T14:00:00Z', venue: 'Arun Jaitley Stadium, Delhi',           status: 'upcoming' },
  { home: 'GT',   away: 'MI',   date: '2026-04-04T14:00:00Z', venue: 'Narendra Modi Stadium, Ahmedabad',      status: 'upcoming' },
  { home: 'LSG',  away: 'CSK',  date: '2026-04-05T14:00:00Z', venue: 'BRSABV Ekana Cricket Stadium, Lucknow', status: 'upcoming' },
  { home: 'RCB',  away: 'SRH',  date: '2026-04-06T14:00:00Z', venue: 'M. Chinnaswamy Stadium, Bengaluru',     status: 'upcoming' },
  { home: 'KKR',  away: 'DC',   date: '2026-04-07T14:00:00Z', venue: 'Eden Gardens, Kolkata',                 status: 'upcoming' },
  { home: 'PBKS', away: 'GT',   date: '2026-04-08T14:00:00Z', venue: 'Punjab Cricket Association IS, Mohali', status: 'upcoming' },
  { home: 'RR',   away: 'LSG',  date: '2026-04-09T14:00:00Z', venue: 'Sawai Mansingh Stadium, Jaipur',        status: 'upcoming' },
]

// Odds based on team strength ratings
const TEAM_ODDS = {
  MI:   { home: 1.75, away: 2.10 },
  CSK:  { home: 1.80, away: 2.05 },
  RCB:  { home: 2.00, away: 1.85 },
  KKR:  { home: 1.95, away: 1.90 },
  DC:   { home: 2.10, away: 1.80 },
  SRH:  { home: 2.05, away: 1.85 },
  RR:   { home: 2.15, away: 1.78 },
  PBKS: { home: 2.20, away: 1.75 },
  LSG:  { home: 2.25, away: 1.72 },
  GT:   { home: 2.00, away: 1.88 },
}

async function main() {
  console.log('Seeding IPL 2026 data...')

  // Upsert cricket sport
  const cricket = await prisma.sport.upsert({
    where: { name: 'Cricket' },
    update: { isActive: true },
    create: { name: 'Cricket', type: 'cricket', isActive: true },
  })
  console.log('  Sport: Cricket ready')

  // Create IPL teams
  const teamMap = {}
  for (const t of IPL_TEAMS) {
    const team = await prisma.team.upsert({
      where: { id: t.short }, // we'll use findFirst instead
      update: {},
      create: { name: t.name, shortName: t.short, sportId: cricket.id },
    }).catch(async () => {
      // If upsert fails (no unique on name), use findFirst or create
      const existing = await prisma.team.findFirst({ where: { shortName: t.short, sportId: cricket.id } })
      if (existing) return existing
      return prisma.team.create({ data: { name: t.name, shortName: t.short, sportId: cricket.id } })
    })
    teamMap[t.short] = team
    console.log(`  Team: ${t.short} ready (${team.id})`)
  }

  // Create fixtures + markets
  let created = 0
  for (const match of SCHEDULE) {
    const homeTeam = teamMap[match.home]
    const awayTeam = teamMap[match.away]
    if (!homeTeam || !awayTeam) { console.log(`  SKIP: ${match.home} vs ${match.away} â€” team not found`); continue }

    // Check if fixture already exists
    const externalId = `IPL2026-${match.home}-${match.away}-${match.date.slice(0,10)}`
    const existing = await prisma.fixture.findFirst({ where: { externalId } })
    if (existing) { console.log(`  EXISTS: ${match.home} vs ${match.away}`); continue }

    const fixture = await prisma.fixture.create({
      data: {
        sportId:    cricket.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startTime:  new Date(match.date),
        status:     match.status,
        venue:      match.venue,
        externalId,
      }
    })

    const homeOdds = TEAM_ODDS[match.home]?.home ?? 1.90
    const awayOdds = TEAM_ODDS[match.away]?.away ?? 1.90

    // Market 1: Match Winner
    const mw = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'Match Winner', type: 'match_winner', status: match.status, inPlay: match.status === 'live' }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: mw.id, name: homeTeam.name, odds: homeOdds, probability: +(1/homeOdds).toFixed(6), isActive: true },
      { marketId: mw.id, name: awayTeam.name, odds: awayOdds, probability: +(1/awayOdds).toFixed(6), isActive: true },
    ]})

    // Market 2: Toss Winner
    const tw = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'Toss Winner', type: 'toss_winner', status: match.status, inPlay: false }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: tw.id, name: homeTeam.name + ' (Toss)', odds: 1.90, probability: 0.526316, isActive: true },
      { marketId: tw.id, name: awayTeam.name + ' (Toss)', odds: 1.90, probability: 0.526316, isActive: true },
    ]})

    // Market 3: Total Runs Over/Under
    const tr = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'Total Runs', type: 'total_runs', status: match.status, inPlay: match.status === 'live' }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: tr.id, name: 'Over 165.5',  odds: 1.88, probability: 0.531915, isActive: true },
      { marketId: tr.id, name: 'Under 165.5', odds: 1.92, probability: 0.520833, isActive: true },
    ]})

    // Market 4: First Over Runs
    const fo = await prisma.market.create({
      data: { fixtureId: fixture.id, name: 'First Over Runs', type: 'first_over', status: match.status, inPlay: match.status === 'live' }
    })
    await prisma.outcome.createMany({ data: [
      { marketId: fo.id, name: 'Over 7.5',  odds: 1.85, probability: 0.540541, isActive: true },
      { marketId: fo.id, name: 'Under 7.5', odds: 1.95, probability: 0.512821, isActive: true },
    ]})

    console.log(`  Created: ${match.home} vs ${match.away} (${match.status}) â€” 4 markets`)
    created++
  }

  console.log(`\nDone! Created ${created} fixtures with markets.`)
  console.log('IPL 2026 data seeded successfully!')
}

main()
  .catch((e) => { console.error('Seed error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())