import Redis from 'ioredis'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('redis-client')

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableReadyCheck: true,
    })
    redis.on('connect', () => log.info('Redis connected'))
    redis.on('error', (err) => log.error({ err }, 'Redis error'))
    redis.on('close', () => log.warn('Redis connection closed'))
  }
  return redis
}

export async function setCache<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  const r = getRedis()
  const serialized = JSON.stringify(value)
  if (ttlSeconds) {
    await r.setex(key, ttlSeconds, serialized)
  } else {
    await r.set(key, serialized)
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await getRedis().get(key)
  if (!val) return null
  return JSON.parse(val) as T
}

export async function deleteCache(key: string): Promise<void> {
  await getRedis().del(key)
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await getRedis().keys(pattern)
  if (keys.length > 0) await getRedis().del(...keys)
}

export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  wallet: (userId: string) => `wallet:${userId}`,
  marketOdds: (marketId: string) => `odds:${marketId}`,
  activeSlip: (userId: string) => `slip:active:${userId}`,
  crashRound: (roundId: string) => `crash:round:${roundId}`,
  rateLimit: (userId: string, action: string) => `rate:${userId}:${action}`,
  session: (token: string) => `session:${token}`,
}

export default getRedis
