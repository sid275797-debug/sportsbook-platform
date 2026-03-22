const { Client } = require('pg')
const crypto = require('crypto')

const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/userdb' })

async function main() {
  await client.connect()
  console.log('Seeding users...')

  // Pre-computed bcrypt hash for "password123"
  const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'

  const users = [
    { email: 'admin@sportsbook.com', username: 'admin',      role: 'admin' },
    { email: 'john@example.com',     username: 'john_doe',   role: 'user'  },
    { email: 'jane@example.com',     username: 'jane_smith', role: 'user'  },
    { email: 'test@example.com',     username: 'testuser',   role: 'user'  },
  ]

  for (const u of users) {
    const id  = crypto.randomUUID()
    const ref = Math.random().toString(36).substring(2, 8).toUpperCase()
    try {
      await client.query(
        `INSERT INTO users (id, email, username, password_hash, role, kyc_status, is_active, referral_code, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,'verified',true,$6,NOW(),NOW())
         ON CONFLICT (email) DO NOTHING`,
        [id, u.email, u.username, hash, u.role, ref]
      )
      console.log('  Created:', u.email)
    } catch(e) {
      console.log('  Skipped:', u.email, '-', e.message)
    }
  }

  console.log('')
  console.log('Done! Login with:')
  console.log('  Email:    john@example.com')
  console.log('  Password: password123')
  await client.end()
}

main().catch(console.error)
