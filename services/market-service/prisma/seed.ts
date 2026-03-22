import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding market data...')

  // ── Sports ──────────────────────────────────────────────
  const football = await prisma.sport.upsert({
    where: { name: 'Football' },
    update: {},
    create: { name: 'Football', type: 'football', isActive: true },
  })
  const cricket = await prisma.sport.upsert({
    where: { name: 'Cricket' },
    update: {},
    create: { name: 'Cricket', type: 'cricket', isActive: true },
  })
  const basketball = await prisma.sport.upsert({
    where: { name: 'Basketball' },
    update: {},
    create: { name: 'Basketball', type: 'basketball', isActive: true },
  })
  console.log('  Sports created')

  // ── Football Teams ────────────────────────────────────
  const [manCity, liverpool, chelsea, arsenal, realMadrid, barcelona] = await Promise.all([
    prisma.team.create({ data: { name: 'Manchester City', shortName: 'MCI', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Liverpool', shortName: 'LIV', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Chelsea', shortName: 'CHE', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Arsenal', shortName: 'ARS', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Real Madrid', shortName: 'RMA', sportId: football.id } }),
    prisma.team.create({ data: { name: 'Barcelona', shortName: 'BAR', sportId: football.id } }),
  ])

  // ── Cricket Teams ────────────────────────────────────
  const [india, australia, england, pakistan] = await Promise.all([
    prisma.team.create({ data: { name: 'India', shortName: 'IND', sportId: cricket.id } }),
    prisma.team.create({ data: { name: 'Australia', shortName: 'AUS', sportId: cricket.id } }),
    prisma.team.create({ data: { name: 'England', shortName: 'ENG', sportId: cricket.id } }),
    prisma.team.create({ data: { name: 'Pakistan', shortName: 'PAK', sportId: cricket.id } }),
  ])

  // ── Basketball Teams ─────────────────────────────────
  const [lakers, warriors, celtics, bulls] = await Promise.all([
    prisma.team.create({ data: { name: 'LA Lakers', shortName: 'LAL', sportId: basketball.id } }),
    prisma.team.create({ data: { name: 'Golden State Warriors', shortName: 'GSW', sportId: basketball.id } }),
    prisma.team.create({ data: { name: 'Boston Celtics', shortName: 'BOS', sportId: basketball.id } }),
    prisma.team.create({ data: { name: 'Chicago Bulls', shortName: 'CHI', sportId: basketball.id } }),
  ])
  console.log('  Teams created')

  // ── Helper: create fixture + match winner market ─────
  const now = new Date()
  const day = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000)

  async function createFixtureWithMarkets(
    sportId: string,
    homeTeamId: string,
    awayTeamId: string,
    startTime: Date,
    status: string,
    homeOdds: number,
    drawOdds: number | null,
    awayOdds: number,
    homeTeamName: string,
    awayTeamName: string,
  ) {
    const fixture = await prisma.fixture.create({
      data: { sportId, homeTeamId, awayTeamId, startTime, status, venue: 'TBD' },
    })

    // Match Winner market
    const market = await prisma.market.create({
      data: {
        fixtureId: fixture.id,
        name: 'Match Winner',
        type: 'match_winner',
        status,
        inPlay: status === 'live',
      },
    })

    const outcomes: any[] = [
      { marketId: market.id, name: homeTeamName, odds: homeOdds, probability: 1 / homeOdds, isActive: true },
      { marketId: market.id, name: awayTeamName, odds: awayOdds, probability: 1 / awayOdds, isActive: true },
    ]
    if (drawOdds) {
      outcomes.splice(1, 0, { marketId: market.id, name: 'Draw', odds: drawOdds, probability: 1 / drawOdds, isActive: true })
    }
    await prisma.outcome.createMany({ data: outcomes })

    // Over/Under market (goals/runs/points)
    const ouMarket = await prisma.market.create({
      data: {
        fixtureId: fixture.id,
        name: 'Over/Under 2.5',
        type: 'over_under',
        status,
        inPlay: status === 'live',
      },
    })
    await prisma.outcome.createMany({
      data: [
        { marketId: ouMarket.id, name: 'Over 2.5', odds: 1.85, probability: 0.54, isActive: true },
        { marketId: ouMarket.id, name: 'Under 2.5', odds: 1.95, probability: 0.51, isActive: true },
      ],
    })

    return fixture
  }

  // ── Football Fixtures ────────────────────────────────
  await createFixtureWithMarkets(football.id, manCity.id, liverpool.id, day(1), 'upcoming', 2.10, 3.40, 3.50, 'Man City', 'Liverpool')
  await createFixtureWithMarkets(football.id, chelsea.id, arsenal.id, day(1), 'upcoming', 2.30, 3.20, 3.10, 'Chelsea', 'Arsenal')
  await createFixtureWithMarkets(football.id, realMadrid.id, barcelona.id, day(2), 'upcoming', 2.05, 3.50, 3.60, 'Real Madrid', 'Barcelona')
  await createFixtureWithMarkets(football.id, liverpool.id, chelsea.id, day(3), 'upcoming', 1.90, 3.60, 4.00, 'Liverpool', 'Chelsea')
  await createFixtureWithMarkets(football.id, arsenal.id, manCity.id, day(4), 'upcoming', 3.80, 3.40, 1.95, 'Arsenal', 'Man City')

  // Live football
  await createFixtureWithMarkets(football.id, manCity.id, barcelona.id, day(-0.1), 'live', 1.75, 3.80, 4.50, 'Man City', 'Barcelona')

  // ── Cricket Fixtures ─────────────────────────────────
  await createFixtureWithMarkets(cricket.id, india.id, australia.id, day(1), 'upcoming', 1.80, null, 2.05, 'India', 'Australia')
  await createFixtureWithMarkets(cricket.id, england.id, pakistan.id, day(2), 'upcoming', 2.10, null, 1.75, 'England', 'Pakistan')
  await createFixtureWithMarkets(cricket.id, india.id, england.id, day(5), 'upcoming', 1.65, null, 2.30, 'India', 'England')

  // Live cricket
  await createFixtureWithMarkets(cricket.id, india.id, pakistan.id, day(-0.2), 'live', 1.55, null, 2.50, 'India', 'Pakistan')

  // ── Basketball Fixtures ──────────────────────────────
  await createFixtureWithMarkets(basketball.id, lakers.id, warriors.id, day(1), 'upcoming', 2.20, null, 1.75, 'LA Lakers', 'GSW')
  await createFixtureWithMarkets(basketball.id, celtics.id, bulls.id, day(2), 'upcoming', 1.60, null, 2.40, 'Boston Celtics', 'Chicago Bulls')

  console.log('  Fixtures and markets created')
  console.log('Done seeding market data!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())