const { PrismaClient } = require('../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client')

const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:postgres@localhost:5432/marketdb?schema=public' } }
})

async function main() {
  console.log('Seeding market data...')

  const football = await prisma.sport.upsert({ where: { name: 'Football' }, update: {}, create: { name: 'Football', type: 'football', isActive: true } })
  const cricket  = await prisma.sport.upsert({ where: { name: 'Cricket' },  update: {}, create: { name: 'Cricket',  type: 'cricket',  isActive: true } })
  const basketball = await prisma.sport.upsert({ where: { name: 'Basketball' }, update: {}, create: { name: 'Basketball', type: 'basketball', isActive: true } })
  console.log('  Sports created')

  const [manCity, liverpool, chelsea, arsenal, realMadrid, barcelona] = await Promise.all([
    prisma.team.create({ data: { name: 'Manchester City',       shortName: 'MCI', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Liverpool',             shortName: 'LIV', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Chelsea',               shortName: 'CHE', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Arsenal',               shortName: 'ARS', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Real Madrid',           shortName: 'RMA', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Barcelona',             shortName: 'BAR', sportId: football.id } }),
  ])

  const [india, australia, england, pakistan] = await Promise.all([
    prisma.team.create({ data: { name: 'India',     shortName: 'IND', sportId: cricket.id } }),
    prisma.team.create({ data: { name: 'Australia', shortName: 'AUS', sportId: cricket.id } }),
    prisma.team.create({ data: { name: 'England',   shortName: 'ENG', sportId: cricket.id } }),
    prisma.team.create({ data: { name: 'Pakistan',  shortName: 'PAK', sportId: cricket.id } }),
  ])

  const [lakers, warriors, celtics, bulls] = await Promise.all([
    prisma.team.create({ data: { name: 'LA Lakers',              shortName: 'LAL', sportId: basketball.id } }),
    prisma.team.create({ data: { name: 'Golden State Warriors',  shortName: 'GSW', sportId: basketball.id } }),
    prisma.team.create({ data: { name: 'Boston Celtics',         shortName: 'BOS', sportId: basketball.id } }),
    prisma.team.create({ data: { name: 'Chicago Bulls',          shortName: 'CHI', sportId: basketball.id } }),
  ])
  console.log('  Teams created')

  const now = new Date()
  const day = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000)

  async function makeFixture(sportId, homeTeamId, awayTeamId, startTime, status, homeName, awayName, homeOdds, drawOdds, awayOdds) {
    const fixture = await prisma.fixture.create({ data: { sportId, homeTeamId, awayTeamId, startTime, status, venue: 'TBD' } })

    const market = await prisma.market.create({ data: { fixtureId: fixture.id, name: 'Match Winner', type: 'match_winner', status, inPlay: status === 'live' } })

    const outcomes = [
      { marketId: market.id, name: homeName, odds: homeOdds, probability: +(1/homeOdds).toFixed(4), isActive: true },
      { marketId: market.id, name: awayName, odds: awayOdds, probability: +(1/awayOdds).toFixed(4), isActive: true },
    ]
    if (drawOdds) outcomes.splice(1, 0, { marketId: market.id, name: 'Draw', odds: drawOdds, probability: +(1/drawOdds).toFixed(4), isActive: true })
    await prisma.outcome.createMany({ data: outcomes })

    const ouMarket = await prisma.market.create({ data: { fixtureId: fixture.id, name: 'Over/Under 2.5', type: 'over_under', status, inPlay: status === 'live' } })
    await prisma.outcome.createMany({ data: [
      { marketId: ouMarket.id, name: 'Over 2.5',  odds: 1.85, probability: 0.5405, isActive: true },
      { marketId: ouMarket.id, name: 'Under 2.5', odds: 1.95, probability: 0.5128, isActive: true },
    ]})

    console.log('  Fixture:', homeName, 'vs', awayName, '(' + status + ')')
  }

  // Football
  await makeFixture(football.id, manCity.id,   liverpool.id,  day(1),    'upcoming', 'Man City',    'Liverpool',  2.10, 3.40, 3.50)
  await makeFixture(football.id, chelsea.id,   arsenal.id,    day(1),    'upcoming', 'Chelsea',     'Arsenal',    2.30, 3.20, 3.10)
  await makeFixture(football.id, realMadrid.id, barcelona.id, day(2),    'upcoming', 'Real Madrid', 'Barcelona',  2.05, 3.50, 3.60)
  await makeFixture(football.id, liverpool.id, chelsea.id,    day(3),    'upcoming', 'Liverpool',   'Chelsea',    1.90, 3.60, 4.00)
  await makeFixture(football.id, arsenal.id,   manCity.id,    day(4),    'upcoming', 'Arsenal',     'Man City',   3.80, 3.40, 1.95)
  await makeFixture(football.id, manCity.id,   barcelona.id,  day(-0.1), 'live',     'Man City',    'Barcelona',  1.75, 3.80, 4.50)

  // Cricket
  await makeFixture(cricket.id, india.id,   australia.id, day(1),    'upcoming', 'India',   'Australia', 1.80, null, 2.05)
  await makeFixture(cricket.id, england.id, pakistan.id,  day(2),    'upcoming', 'England', 'Pakistan',  2.10, null, 1.75)
  await makeFixture(cricket.id, india.id,   england.id,   day(5),    'upcoming', 'India',   'England',   1.65, null, 2.30)
  await makeFixture(cricket.id, india.id,   pakistan.id,  day(-0.2), 'live',     'India',   'Pakistan',  1.55, null, 2.50)

  // Basketball
  await makeFixture(basketball.id, lakers.id,  warriors.id, day(1), 'upcoming', 'LA Lakers',     'GSW',          2.20, null, 1.75)
  await makeFixture(basketball.id, celtics.id, bulls.id,    day(2), 'upcoming', 'Boston Celtics', 'Chicago Bulls', 1.60, null, 2.40)

  console.log('Done seeding market data!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
