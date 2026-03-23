// Run from project root: node fix-fixtures-complete.js
const { Client } = require('pg')
const db = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/marketdb' })
const now = new Date()
const day  = (d) => new Date(now.getTime() + d * 86400000 + 19.5 * 3600000).toISOString()
const hour = (h) => new Date(now.getTime() + h * 3600000).toISOString()

async function main() {
  await db.connect()
  console.log('Connected\n')

  const { rows: sports }   = await db.query('SELECT id, name, type FROM sports')
  const { rows: teams }    = await db.query('SELECT id, name, short_name FROM teams')
  const { rows: fixtures } = await db.query('SELECT id FROM fixtures ORDER BY created_at ASC')
  console.log(`Sports: ${sports.length}, Teams: ${teams.length}, Fixtures: ${fixtures.length}`)

  // Step 1: Fix existing fixture dates
  for (let i = 0; i < fixtures.length; i++) {
    const isLive = i % 6 === 0 && i < 12
    await db.query(
      'UPDATE fixtures SET start_time=$1, status=$2, updated_at=NOW() WHERE id=$3',
      [isLive ? hour(-1) : day(Math.floor(i*0.5)%14+1), isLive?'live':'upcoming', fixtures[i].id]
    )
  }
  console.log(`✅ Fixed ${fixtures.length} fixture dates`)

  // Step 2: Get cricket sport
  let cricket = sports.find(s => s.type?.toLowerCase()==='cricket' || s.name?.toLowerCase()==='cricket')
  if (!cricket) {
    const r = await db.query(
      `INSERT INTO sports (id,name,type,is_active) VALUES (gen_random_uuid(),'Cricket','cricket',true) RETURNING *`
    )
    cricket = r.rows[0]
    console.log('✅ Created cricket sport')
  } else {
    console.log('✅ Cricket sport:', cricket.name)
  }

  // Step 3: IPL teams (no created_at/updated_at on teams table)
  const IPL = [
    {name:'Mumbai Indians',s:'MI'},{name:'Chennai Super Kings',s:'CSK'},
    {name:'Royal Challengers Bengaluru',s:'RCB'},{name:'Kolkata Knight Riders',s:'KKR'},
    {name:'Delhi Capitals',s:'DC'},{name:'Punjab Kings',s:'PBKS'},
    {name:'Rajasthan Royals',s:'RR'},{name:'Sunrisers Hyderabad',s:'SRH'},
    {name:'Gujarat Titans',s:'GT'},{name:'Lucknow Super Giants',s:'LSG'},
  ]
  const tm = {}
  for (const t of IPL) {
    const ex = teams.find(x => x.short_name===t.s || x.name===t.name)
    if (ex) { tm[t.s]=ex.id }
    else {
      const r = await db.query(
        `INSERT INTO teams (id,name,short_name,sport_id) VALUES (gen_random_uuid(),$1,$2,$3) RETURNING id`,
        [t.name, t.s, cricket.id]
      )
      tm[t.s]=r.rows[0].id
      console.log(`  + ${t.name}`)
    }
  }
  console.log('✅ Teams ready')

  // Step 4: IPL fixtures
  const MATCHES = [
    {h:'CSK',a:'RCB',d:1},{h:'MI',a:'KKR',d:2},{h:'SRH',a:'DC',d:3},
    {h:'RR',a:'PBKS',d:4},{h:'GT',a:'LSG',d:5},{h:'CSK',a:'MI',d:6},
    {h:'RCB',a:'KKR',d:7},{h:'DC',a:'RR',d:8},{h:'PBKS',a:'SRH',d:9},
    {h:'LSG',a:'GT',d:10},{h:'MI',a:'RCB',d:11},{h:'KKR',a:'CSK',d:12},
    {h:'DC',a:'SRH',d:13},{h:'RR',a:'GT',d:14},{h:'PBKS',a:'LSG',d:15},
    {h:'CSK',a:'DC',d:16},{h:'RCB',a:'SRH',d:17},{h:'MI',a:'RR',d:18},
    {h:'KKR',a:'PBKS',d:19},{h:'GT',a:'CSK',d:20},{h:'LSG',a:'RCB',d:21},
  ]

  const {rows:[{count:iplCount}]} = await db.query(
    `SELECT COUNT(*) as count FROM fixtures f JOIN teams t ON f.home_team_id=t.id WHERE t.short_name IN ('CSK','MI','RCB')`
  )

  let created = 0
  if (parseInt(iplCount) < 5) {
    for (const m of MATCHES) {
      if (!tm[m.h]||!tm[m.a]) continue
      const {rows:[fix]} = await db.query(
        `INSERT INTO fixtures (id,sport_id,home_team_id,away_team_id,start_time,status,updated_at)
         VALUES (gen_random_uuid(),$1,$2,$3,$4,'upcoming',NOW()) RETURNING id`,
        [cricket.id, tm[m.h], tm[m.a], day(m.d)]
      )
      // Match Winner market (no updated_at on markets)
      const {rows:[mkt]} = await db.query(
        `INSERT INTO markets (id,fixture_id,name,type,status) VALUES (gen_random_uuid(),$1,'Match Winner','match_winner','active') RETURNING id`,
        [fix.id]
      )
      const hn = IPL.find(t=>t.s===m.h).name
      const an = IPL.find(t=>t.s===m.a).name
      // outcomes: no status, no created_at — just id,market_id,name,odds,probability,is_active
      await db.query(
        `INSERT INTO outcomes (id,market_id,name,odds,probability,is_active)
         VALUES (gen_random_uuid(),$1,$2,$3,$4,true),(gen_random_uuid(),$1,$5,$6,$7,true)`,
        [mkt.id, hn, (1.7+Math.random()*0.6).toFixed(2), 0.5, an, (1.7+Math.random()*0.6).toFixed(2), 0.5]
      )
      // Toss Winner market
      const {rows:[tmkt]} = await db.query(
        `INSERT INTO markets (id,fixture_id,name,type,status) VALUES (gen_random_uuid(),$1,'Toss Winner','toss_winner','active') RETURNING id`,
        [fix.id]
      )
      await db.query(
        `INSERT INTO outcomes (id,market_id,name,odds,probability,is_active)
         VALUES (gen_random_uuid(),$1,$2,1.90,0.5,true),(gen_random_uuid(),$1,$3,1.90,0.5,true)`,
        [tmkt.id, hn, an]
      )
      created++
    }
    console.log(`✅ Created ${created} IPL 2026 fixtures`)
  } else {
    console.log(`✅ IPL already exists (${iplCount})`)
  }

  const {rows:counts} = await db.query('SELECT status, COUNT(*) c FROM fixtures GROUP BY status')
  console.log('\n=== RESULT ===')
  counts.forEach(r => console.log(`  ${r.status}: ${r.c}`))
  await db.end()
  console.log('\n✅ Done! Refresh http://localhost:3000')
}
main().catch(e=>{console.error('Error:',e.message);process.exit(1)})
