// Resets all upcoming fixture dates to be in the future
// Run from project root: node fix-fixture-dates.js

const { Client } = require('pg')

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/marketdb' })

async function main() {
  await client.connect()
  console.log('Fixing fixture dates...')

  const now = new Date()
  const day = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString()
  const hour = (h) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString()

  // Get all fixtures
  const { rows: fixtures } = await client.query(
    `SELECT id, status, home_team_id, away_team_id FROM fixtures ORDER BY created_at ASC`
  )

  console.log(`Found ${fixtures.length} fixtures`)

  // Assign new future dates in a spread pattern
  let upcoming = 0
  let live = 0

  for (let i = 0; i < fixtures.length; i++) {
    const f = fixtures[i]
    
    // Keep some as live (every 5th fixture)
    if (i % 5 === 0 && live < 5) {
      await client.query(
        `UPDATE fixtures SET start_time = $1, status = 'live', updated_at = NOW() WHERE id = $2`,
        [hour(-1), f.id]
      )
      live++
    } else {
      // Spread upcoming across next 14 days
      const daysAhead = 0.5 + (upcoming * 0.3) % 14
      await client.query(
        `UPDATE fixtures SET start_time = $1, status = 'upcoming', updated_at = NOW() WHERE id = $2`,
        [day(daysAhead), f.id]
      )
      upcoming++
    }
  }

  console.log(`✅ Updated ${live} fixtures to LIVE`)
  console.log(`✅ Updated ${upcoming} fixtures to UPCOMING with future dates`)
  
  // Verify
  const { rows: counts } = await client.query(
    `SELECT status, COUNT(*) as count FROM fixtures GROUP BY status`
  )
  console.log('\nFixture status counts:')
  counts.forEach(r => console.log(`  ${r.status}: ${r.count}`))

  await client.end()
  console.log('\nDone! Restart pnpm dev or wait for hot reload.')
}

main().catch(console.error)
