// Run from: C:\Users\VCOM\Desktop\fixed\sportsbook-fixed\services\user-service
// Command: node debug-prisma.js

console.log('cwd:', process.cwd())

try {
  const path1 = require.resolve('@prisma/client')
  console.log('Standard @prisma/client:', path1)
} catch(e) {
  console.log('Standard @prisma/client: NOT FOUND')
}

try {
  const path2 = require.resolve('@prisma/client', { paths: [process.cwd()] })
  console.log('@prisma/client from cwd:', path2)
  const { PrismaClient } = require(path2)
  const prisma = new PrismaClient()
  console.log('PrismaClient models:', Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')))
} catch(e) {
  console.log('ERROR:', e.message)
}

// Try finding .prisma/client
const fs = require('fs')
const path = require('path')

function findPrismaClient(dir) {
  const target = path.join(dir, 'node_modules', '.prisma', 'client', 'index.js')
  if (fs.existsSync(target)) return target
  const parent = path.dirname(dir)
  if (parent === dir) return null
  return findPrismaClient(parent)
}

const found = findPrismaClient(process.cwd())
console.log('\n.prisma/client found at:', found)

if (found) {
  try {
    const { PrismaClient } = require(path.join(path.dirname(found), '..', '@prisma', 'client'))
    const p = new PrismaClient()
    console.log('Models from found path:', Object.keys(p).filter(k => !k.startsWith('_') && !k.startsWith('$')))
  } catch(e) {
    console.log('Error loading from found path:', e.message)
  }
}
