// session-markets-seed.js
// Seeds Powerplay / Middle / Death session markets for all IPL fixtures
// Run from: services/market-service
// Command: node session-markets-seed.js

require('dotenv/config')
const { PrismaClient } = require('./node_modules/.prisma/client')
const prisma = new PrismaClient()

// IPL T20 historical averages for realistic lines
const SESSION_TEMPLATES = [
  // Powerplay (O1-6) â€” avg 48 runs, ~1.2 wickets in IPL 2024
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
  // Middle overs (O7-15) â€” avg 60 runs
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
  // Death overs (O16-20) â€” avg 54 runs
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
  if (!cricket) { console.error('Cricket sport not found â€” run ipl-seed.js first'); process.exit(1) }

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