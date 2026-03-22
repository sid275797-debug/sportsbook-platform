const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = 'C:\\Users\\VCOM\\Desktop\\fixed\\sportsbook-fixed'

const SERVICES = [
  { name: 'user-service',    dir: 'services/user-service' },
  { name: 'wallet-service',  dir: 'services/wallet-service' },
  { name: 'market-service',  dir: 'services/market-service' },
  { name: 'betting-engine',  dir: 'services/betting-engine' },
  { name: 'casino-engine',   dir: 'services/casino-engine' },
]

console.log('=== PERMANENT PRISMA FIX ===\n')

// Step 1: Update each schema.prisma to output to its own local node_modules
for (const svc of SERVICES) {
  const schemaPath = path.join(ROOT, svc.dir, 'prisma', 'schema.prisma')
  let content = fs.readFileSync(schemaPath, 'utf8')

  // Only add output if not already there
  if (!content.includes('output')) {
    content = content.replace(
      'provider = "prisma-client-js"',
      'provider = "prisma-client-js"\n  output   = "../node_modules/.prisma/client"'
    )
    fs.writeFileSync(schemaPath, content, 'utf8')
    console.log(`✅ Updated schema: ${svc.name}`)
  } else {
    console.log(`⏭️  Already has output: ${svc.name}`)
  }
}

console.log('\n=== GENERATING PRISMA CLIENTS ===\n')

// Step 2: Generate each service's client into its own folder
for (const svc of SERVICES) {
  const svcDir = path.join(ROOT, svc.dir)
  console.log(`Generating ${svc.name}...`)
  try {
    execSync('npx prisma generate', {
      cwd: svcDir,
      stdio: 'pipe',
      timeout: 60000,
    })
    console.log(`✅ ${svc.name} done`)
  } catch (e) {
    console.log(`❌ ${svc.name} failed:`, e.message)
  }
}

console.log('\n=== DONE ===')
console.log('Each service now has its own isolated Prisma client.')
console.log('This will NEVER overwrite again.')
console.log('\nNow run: pnpm dev')
