const { Client } = require('pg')
const crypto = require('crypto')

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/marketdb' })
const uuid = () => crypto.randomUUID()

async function main() {
  await client.connect()
  console.log('Seeding additional sports...')

  // ── Sports ──────────────────────────────────────────────────────────────────
  const kabaddiId = uuid(), tennisId = uuid(), horseId = uuid(), volleyId = uuid(), ttId = uuid()

  await client.query(`
    INSERT INTO sports (id, name, type, is_active) VALUES
    ($1,'Kabaddi','kabaddi',true),
    ($2,'Tennis','tennis',true),
    ($3,'Horse Racing','horse_racing',true),
    ($4,'Volleyball','volleyball',true),
    ($5,'Table Tennis','table_tennis',true)
    ON CONFLICT (name) DO NOTHING
  `, [kabaddiId, tennisId, horseId, volleyId, ttId])
  console.log('  Sports created')

  const now = new Date()
  const day = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString()

  // ── Helper ───────────────────────────────────────────────────────────────────
  async function makeFixture(sportId, homeId, awayId, startTime, status, homeName, awayName, homeOdds, drawOdds, awayOdds) {
    const fid = uuid()
    await client.query(
      `INSERT INTO fixtures (id, sport_id, home_team_id, away_team_id, start_time, status, venue, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,'TBD',NOW(),NOW())`,
      [fid, sportId, homeId, awayId, startTime, status]
    )
    const mid = uuid()
    await client.query(`INSERT INTO markets (id, fixture_id, name, type, status, in_play, created_at) VALUES ($1,$2,'Match Winner','match_winner',$3,$4,NOW())`,
      [mid, fid, status, status === 'live'])
    const outcomes = [[homeName, homeOdds], [awayName, awayOdds]]
    if (drawOdds) outcomes.splice(1, 0, ['Draw', drawOdds])
    for (const [name, odds] of outcomes) {
      await client.query(`INSERT INTO outcomes (id, market_id, name, odds, probability, is_active) VALUES ($1,$2,$3,$4,$5,true)`,
        [uuid(), mid, name, odds, +(1/odds).toFixed(4)])
    }
    console.log(' ', homeName, 'vs', awayName, '(' + status + ')')
    return fid
  }

  async function makeTeam(name, short, sportId) {
    const id = uuid()
    await client.query(`INSERT INTO teams (id, name, short_name, sport_id) VALUES ($1,$2,$3,$4)`, [id, name, short, sportId])
    return id
  }

  // ── KABADDI (PKL Teams) ──────────────────────────────────────────────────────
  console.log('\n  Kabaddi (PKL):')
  const pkl_jaipur  = await makeTeam('Jaipur Pink Panthers',  'JPP', kabaddiId)
  const pkl_patna   = await makeTeam('Patna Pirates',          'PAT', kabaddiId)
  const pkl_mumbai  = await makeTeam('U Mumba',                'MUM', kabaddiId)
  const pkl_bengal  = await makeTeam('Bengal Warriors',        'BEN', kabaddiId)
  const pkl_delhi   = await makeTeam('Dabang Delhi',           'DEL', kabaddiId)
  const pkl_pune    = await makeTeam('Puneri Paltan',          'PUN', kabaddiId)
  const pkl_bengaluru = await makeTeam('Bengaluru Bulls',      'BLR', kabaddiId)
  const pkl_up      = await makeTeam('UP Yoddhas',             'UPY', kabaddiId)

  await makeFixture(kabaddiId, pkl_jaipur,  pkl_patna,   day(0.5), 'live',     'Jaipur Pink Panthers', 'Patna Pirates',     1.75, null, 2.10)
  await makeFixture(kabaddiId, pkl_mumbai,  pkl_bengal,  day(1),   'upcoming', 'U Mumba',              'Bengal Warriors',   1.90, null, 1.95)
  await makeFixture(kabaddiId, pkl_delhi,   pkl_pune,    day(1),   'upcoming', 'Dabang Delhi',         'Puneri Paltan',     2.05, null, 1.80)
  await makeFixture(kabaddiId, pkl_bengaluru, pkl_up,    day(2),   'upcoming', 'Bengaluru Bulls',      'UP Yoddhas',        1.85, null, 2.00)
  await makeFixture(kabaddiId, pkl_patna,   pkl_delhi,   day(3),   'upcoming', 'Patna Pirates',        'Dabang Delhi',      1.70, null, 2.20)

  // ── TENNIS (ATP/WTA) ─────────────────────────────────────────────────────────
  console.log('\n  Tennis:')
  const djokovic  = await makeTeam('Novak Djokovic',    'NJD', tennisId)
  const alcaraz   = await makeTeam('Carlos Alcaraz',    'CAR', tennisId)
  const sinner    = await makeTeam('Jannik Sinner',     'SIN', tennisId)
  const medvedev  = await makeTeam('Daniil Medvedev',   'MED', tennisId)
  const swiatek   = await makeTeam('Iga Swiatek',       'SWT', tennisId)
  const gauff     = await makeTeam('Coco Gauff',        'GAU', tennisId)
  const sabalenka = await makeTeam('Aryna Sabalenka',   'SAB', tennisId)
  const rybakina  = await makeTeam('Elena Rybakina',    'RYB', tennisId)

  await makeFixture(tennisId, sinner,    alcaraz,   day(0.3), 'live',     'Sinner',    'Alcaraz',    2.10, null, 1.75)
  await makeFixture(tennisId, djokovic,  medvedev,  day(1),   'upcoming', 'Djokovic',  'Medvedev',   1.65, null, 2.30)
  await makeFixture(tennisId, swiatek,   gauff,     day(1),   'upcoming', 'Swiatek',   'Gauff',      1.55, null, 2.50)
  await makeFixture(tennisId, sabalenka, rybakina,  day(2),   'upcoming', 'Sabalenka', 'Rybakina',   1.85, null, 2.00)
  await makeFixture(tennisId, alcaraz,   djokovic,  day(3),   'upcoming', 'Alcaraz',   'Djokovic',   1.90, null, 1.95)

  // ── HORSE RACING ─────────────────────────────────────────────────────────────
  console.log('\n  Horse Racing:')
  // For horse racing, we use "teams" as horses
  const h1 = await makeTeam('Royal Challenger',   'RC',  horseId)
  const h2 = await makeTeam('Thunder Strike',      'TS',  horseId)
  const h3 = await makeTeam('Golden Arrow',        'GA',  horseId)
  const h4 = await makeTeam('Desert Storm',        'DS',  horseId)
  const h5 = await makeTeam('Midnight Express',    'ME',  horseId)
  const h6 = await makeTeam('Silver Spirit',       'SS',  horseId)
  const h7 = await makeTeam('Lucky Star',          'LS',  horseId)
  const h8 = await makeTeam('Iron Will',           'IW',  horseId)

  // Race 1 — upcoming
  const race1 = uuid()
  await client.query(`INSERT INTO fixtures (id, sport_id, home_team_id, away_team_id, start_time, status, venue, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,'upcoming','Mahalaxmi Racecourse Mumbai',NOW(),NOW())`,
    [race1, horseId, h1, h2, day(0.2)])
  const r1m = uuid()
  await client.query(`INSERT INTO markets (id, fixture_id, name, type, status, in_play, created_at) VALUES ($1,$2,'Win','win_market','upcoming',false,NOW())`, [r1m, race1])
  const horses1 = [[h1,'Royal Challenger',3.50],[h2,'Thunder Strike',4.20],[h3,'Golden Arrow',6.00],[h4,'Desert Storm',8.50],[h5,'Midnight Express',5.00]]
  for (const [id, name, odds] of horses1) {
    await client.query(`INSERT INTO outcomes (id, market_id, name, odds, probability, is_active) VALUES ($1,$2,$3,$4,$5,true)`,
      [uuid(), r1m, name, odds, +(1/odds).toFixed(4)])
  }
  console.log('  Mumbai Race 1 — 5 runners')

  // Race 2 — upcoming  
  const race2 = uuid()
  await client.query(`INSERT INTO fixtures (id, sport_id, home_team_id, away_team_id, start_time, status, venue, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,'upcoming','Bangalore Turf Club',NOW(),NOW())`,
    [race2, horseId, h5, h6, day(1)])
  const r2m = uuid()
  await client.query(`INSERT INTO markets (id, fixture_id, name, type, status, in_play, created_at) VALUES ($1,$2,'Win','win_market','upcoming',false,NOW())`, [r2m, race2])
  const horses2 = [[h5,'Midnight Express',2.80],[h6,'Silver Spirit',3.20],[h7,'Lucky Star',5.50],[h8,'Iron Will',7.00],[h1,'Royal Challenger',4.00]]
  for (const [id, name, odds] of horses2) {
    await client.query(`INSERT INTO outcomes (id, market_id, name, odds, probability, is_active) VALUES ($1,$2,$3,$4,$5,true)`,
      [uuid(), r2m, name, odds, +(1/odds).toFixed(4)])
  }
  console.log('  Bangalore Race 2 — 5 runners')

  // ── VOLLEYBALL ───────────────────────────────────────────────────────────────
  console.log('\n  Volleyball:')
  const v1 = await makeTeam('India Volleyball',    'IND', volleyId)
  const v2 = await makeTeam('Brazil Volleyball',   'BRA', volleyId)
  const v3 = await makeTeam('Poland Volleyball',   'POL', volleyId)
  const v4 = await makeTeam('France Volleyball',   'FRA', volleyId)
  const v5 = await makeTeam('Italy Volleyball',    'ITA', volleyId)
  const v6 = await makeTeam('USA Volleyball',      'USA', volleyId)

  await makeFixture(volleyId, v1, v2, day(1),    'upcoming', 'India',  'Brazil',  3.50, null, 1.30)
  await makeFixture(volleyId, v3, v4, day(1),    'upcoming', 'Poland', 'France',  1.75, null, 2.10)
  await makeFixture(volleyId, v5, v6, day(2),    'upcoming', 'Italy',  'USA',     2.00, null, 1.85)
  await makeFixture(volleyId, v2, v3, day(0.4),  'live',     'Brazil', 'Poland',  1.60, null, 2.40)

  // ── TABLE TENNIS ─────────────────────────────────────────────────────────────
  console.log('\n  Table Tennis:')
  const tt1 = await makeTeam('Fan Zhendong',    'CHN1', ttId)
  const tt2 = await makeTeam('Ma Long',         'CHN2', ttId)
  const tt3 = await makeTeam('Timo Boll',       'GER',  ttId)
  const tt4 = await makeTeam('Tomokazu Harimoto','JPN', ttId)
  const tt5 = await makeTeam('Achanta Sharath', 'IND',  ttId)
  const tt6 = await makeTeam('Wong Chun Ting',  'HKG',  ttId)

  await makeFixture(ttId, tt1, tt2, day(0.1),  'live',     'Fan Zhendong', 'Ma Long',        1.85, null, 2.00)
  await makeFixture(ttId, tt3, tt4, day(1),    'upcoming', 'Timo Boll',    'Harimoto',       2.20, null, 1.70)
  await makeFixture(ttId, tt5, tt6, day(1),    'upcoming', 'Sharath',      'Wong Chun Ting', 2.80, null, 1.45)
  await makeFixture(ttId, tt2, tt3, day(2),    'upcoming', 'Ma Long',      'Timo Boll',      1.55, null, 2.50)

  console.log('\nDone! Added: Kabaddi (PKL), Tennis (ATP/WTA), Horse Racing, Volleyball, Table Tennis')
  console.log('Total new fixtures: 22')
  await client.end()
}

main().catch(console.error)
