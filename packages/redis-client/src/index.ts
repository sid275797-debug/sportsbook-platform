import Redis from 'ioredis'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('redis-client')
let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3, lazyConnect: true, enableReadyCheck: true,
    })
    redis.on('connect', () => log.info('Redis connected'))
    redis.on('error', (err) => log.error({ err }, 'Redis error'))
  }
  return redis
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  try {
    const r = getRedis()
    const s = JSON.stringify(value)
    if (ttlSeconds) await r.setex(key, ttlSeconds, s)
    else await r.set(key, s)
  } catch (err) { log.warn({ err, key }, 'Cache set failed') }
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const val = await getRedis().get(key)
    if (!val) return null
    return JSON.parse(val) as T
  } catch { return null }
}

export async function deleteCache(key: string): Promise<void> {
  try { await getRedis().del(key) } catch {}
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const r = getRedis()
    let cursor = '0'
    do {
      const [next, keys] = await r.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = next
      if (keys.length > 0) await r.del(...keys)
    } while (cursor !== '0')
  } catch {}
}

export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  wallet: (userId: string) => `wallet:${userId}`,
  marketOdds: (marketId: string) => `odds:${marketId}`,
  activeSlip: (userId: string) => `slip:active:${userId}`,
  crashRound: (roundId: string) => `crash:round:${roundId}`,
  rateLimit: (userId: string, action: string) => `rate:${userId}:${action}`,
  session: (token: string) => `session:${token}`,
  pointsTable: () => 'cricket:points_table',
}

export default getRedis
