import crypto from 'crypto'

export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateHash(serverSeed: string, clientSeed: string, nonce: number): string {
  return crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex')
}

export function hashToFloat(hash: string): number {
  const subset = hash.slice(0, 8)
  const value = parseInt(subset, 16)
  return value / 0xffffffff
}

export function generateCrashPoint(serverSeed: string, clientSeed: string, nonce: number): number {
  const hash = generateHash(serverSeed, clientSeed, nonce)
  const floatVal = hashToFloat(hash)
  const houseEdge = 0.01  // 1%
  if (floatVal < houseEdge) return 1.0  // instant crash

  const raw = (1 / (1 - floatVal)) * (1 - houseEdge)
  return Math.floor(raw * 100) / 100  // 2 decimal places
}

export function generateDiceResult(serverSeed: string, clientSeed: string, nonce: number): number {
  const hash = generateHash(serverSeed, clientSeed, nonce)
  const float = hashToFloat(hash)
  return Math.floor(float * 10000) / 100  // 0.00 to 99.99
}

export function verifyFairness(serverSeed: string, clientSeed: string, nonce: number, expectedHash: string): boolean {
  return generateHash(serverSeed, clientSeed, nonce) === expectedHash
}
