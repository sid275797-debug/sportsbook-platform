const { Client } = require('pg')
const crypto = require('crypto')

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/marketdb' })
const uuid = () => crypto.randomUUID()

async function main() {
  await client.connect()
  console.log('Seeding market data...')

  // Sports
  const footId = uuid(), criId = uuid(), baskId = uuid()
  await client.query(`INSERT INTO sports (id, name, type, is_active) VALUES ($1,'Football','football',true),($2,'Cricket','cricket',true),($3,'Basketball','basketball',true) ON CONFLICT (name) DO NOTHING`, [footId, criId, baskId])
  console.log('  Sports created')

  // Football teams
  const mci=uuid(),liv=uuid(),che=uuid(),ars=uuid(),rma=uuid(),bar=uuid()
  await client.query(`INSERT INTO teams (id,name,short_name,sport_id) VALUES ($1,'Manchester City','MCI',$7),($2,'Liverpool','LIV',$7),($3,'Chelsea','CHE',$7),($4,'Arsenal','ARS',$7),($5,'Real Madrid','RMA',$7),($6,'Barcelona','BAR',$7)`,
    [mci,liv,che,ars,rma,bar,footId])

  // Cricket teams
  const ind=uuid(),aus=uuid(),eng=uuid(),pak=uuid()
  await client.query(`INSERT INTO teams (id,name,short_name,sport_id) VALUES ($1,'India','IND',$5),($2,'Australia','AUS',$5),($3,'England','ENG',$5),($4,'Pakistan','PAK',$5)`,
    [ind,aus,eng,pak,criId])

  // Basketball teams
  const lal=uuid(),gsw=uuid(),bos=uuid(),chi=uuid()
  await client.query(`INSERT INTO teams (id,name,short_name,sport_id) VALUES ($1,'LA Lakers','LAL',$5),($2,'Golden State Warriors','GSW',$5),($3,'Boston Celtics','BOS',$5),($4,'Chicago Bulls','CHI',$5)`,
    [lal,gsw,bos,chi,baskId])
  console.log('  Teams created')

  const now = new Date()
  const day = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString()

  async function makeFixture(sportId, homeId, awayId, startTime, status, homeName, awayName, homeOdds, drawOdds, awayOdds) {
    const fid = uuid()
    await client.query(
      `INSERT INTO fixtures (id, sport_id, home_team_id, away_team_id, start_time, status, venue, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,'TBD',NOW(),NOW())`,
      [fid, sportId, homeId, awayId, startTime, status]
    )

    // Match Winner market
    const mid = uuid()
    await client.query(`INSERT INTO markets (id, fixture_id, name, type, status, in_play, created_at) VALUES ($1,$2,'Match Winner','match_winner',$3,$4,NOW())`,
      [mid, fid, status, status === 'live'])

    const outcomes = [[homeName, homeOdds], [awayName, awayOdds]]
    if (drawOdds) outcomes.splice(1, 0, ['Draw', drawOdds])
    for (const [name, odds] of outcomes) {
      await client.query(`INSERT INTO outcomes (id, market_id, name, odds, probability, is_active) VALUES ($1,$2,$3,$4,$5,true)`,
        [uuid(), mid, name, odds, +(1/odds).toFixed(4)])
    }

    // Over/Under market
    const ouid = uuid()
    await client.query(`INSERT INTO markets (id, fixture_id, name, type, status, in_play, created_at) VALUES ($1,$2,'Over/Under 2.5','over_under',$3,$4,NOW())`,
      [ouid, fid, status, status === 'live'])
    await client.query(`INSERT INTO outcomes (id, market_id, name, odds, probability, is_active) VALUES ($1,$2,'Over 2.5',1.85,0.5405,true),($3,$2,'Under 2.5',1.95,0.5128,true)`,
      [uuid(), ouid, uuid()])

    console.log(' ', homeName, 'vs', awayName, '(' + status + ')')
  }

  // Football fixtures
  await makeFixture(footId, mci, liv, day(1),    'upcoming', 'Man City',    'Liverpool',  2.10, 3.40, 3.50)
  await makeFixture(footId, che, ars, day(1),    'upcoming', 'Chelsea',     'Arsenal',    2.30, 3.20, 3.10)
  await makeFixture(footId, rma, bar, day(2),    'upcoming', 'Real Madrid', 'Barcelona',  2.05, 3.50, 3.60)
  await makeFixture(footId, liv, che, day(3),    'upcoming', 'Liverpool',   'Chelsea',    1.90, 3.60, 4.00)
  await makeFixture(footId, ars, mci, day(4),    'upcoming', 'Arsenal',     'Man City',   3.80, 3.40, 1.95)
  await makeFixture(footId, mci, bar, day(-0.1), 'live',     'Man City',    'Barcelona',  1.75, 3.80, 4.50)

  // Cricket fixtures
  await makeFixture(criId, ind, aus, day(1),    'upcoming', 'India',   'Australia', 1.80, null, 2.05)
  await makeFixture(criId, eng, pak, day(2),    'upcoming', 'England', 'Pakistan',  2.10, null, 1.75)
  await makeFixture(criId, ind, eng, day(5),    'upcoming', 'India',   'England',   1.65, null, 2.30)
  await makeFixture(criId, ind, pak, day(-0.2), 'live',     'India',   'Pakistan',  1.55, null, 2.50)

  // Basketball fixtures
  await makeFixture(baskId, lal, gsw, day(1), 'upcoming', 'LA Lakers',      'GSW',          2.20, null, 1.75)
  await makeFixture(baskId, bos, chi, day(2), 'upcoming', 'Boston Celtics', 'Chicago Bulls', 1.60, null, 2.40)

  console.log('Done seeding market data!')
  await client.end()
}

main().catch(console.error)
