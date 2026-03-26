import db from '../prisma'
import { deleteCache, CacheKeys } from '@sportsbook/redis-client'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('wallet-service')

export class WalletService {
  async getOrCreateWallet(userId: string, currency = 'INR') {
    return db.wallet.upsert({ where: { userId }, update: {}, create: { userId, currency } })
  }

  async getBalance(userId: string) {
    const w = await this.getOrCreateWallet(userId)
    return { available: Number(w.balance), locked: Number(w.lockedBalance), bonus: Number(w.bonusBalance), total: Number(w.balance) + Number(w.bonusBalance) }
  }

  async credit(userId: string, amount: number, type: string, reference: string, metadata?: Record<string, unknown>) {
    const txn = await db.$transaction(async (tx: any) => {
      const w = await tx.wallet.findUnique({ where: { userId } })
      if (!w) throw new Error('Wallet not found for user ' + userId)
      const bb = Number(w.balance), ba = bb + amount
      await tx.wallet.update({ where: { id: w.id }, data: { balance: { increment: amount } } })
      const t = await tx.transaction.create({ data: { walletId: w.id, userId, type, status: 'completed', amount, currency: w.currency, balanceBefore: bb, balanceAfter: ba, reference, metadata: metadata as any } })
      await deleteCache(CacheKeys.wallet(userId))
      return t
    })
    setImmediate(async () => {
      try { const { getProducer, publish } = await import('@sportsbook/kafka-client'); const { KAFKA_TOPICS } = await import('@sportsbook/shared-types'); const p = await getProducer(); await publish(p, KAFKA_TOPICS.WALLET_CREDITED, userId, { userId, amount, type, reference }) } catch {}
    })
    log.info({ userId, amount, type }, 'Wallet credited')
    return txn
  }

  async debit(userId: string, amount: number, type: string, reference: string, metadata?: Record<string, unknown>) {
    const txn = await db.$transaction(async (tx: any) => {
      const w = await tx.wallet.findUnique({ where: { userId } })
      if (!w) throw new Error('Wallet not found')
      if (Number(w.balance) < amount) throw new Error('Insufficient balance')
      const bb = Number(w.balance), ba = bb - amount
      await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: amount } } })
      const t = await tx.transaction.create({ data: { walletId: w.id, userId, type, status: 'completed', amount, currency: w.currency, balanceBefore: bb, balanceAfter: ba, reference, metadata: metadata as any } })
      await deleteCache(CacheKeys.wallet(userId))
      return t
    })
    setImmediate(async () => {
      try { const { getProducer, publish } = await import('@sportsbook/kafka-client'); const { KAFKA_TOPICS } = await import('@sportsbook/shared-types'); const p = await getProducer(); await publish(p, KAFKA_TOPICS.WALLET_DEBITED, userId, { userId, amount, type, reference }) } catch {}
    })
    log.info({ userId, amount, type }, 'Wallet debited')
    return txn
  }

  async lockFunds(userId: string, amount: number) {
    return db.$transaction(async (tx: any) => {
      const w = await tx.wallet.findUnique({ where: { userId } })
      if (!w || Number(w.balance) < amount) throw new Error('Insufficient funds to lock')
      await tx.wallet.update({ where: { id: w.id }, data: { balance: { decrement: amount }, lockedBalance: { increment: amount } } })
    })
  }

  async unlockFunds(userId: string, amount: number) {
    return db.$transaction(async (tx: any) => {
      await tx.wallet.update({ where: { userId }, data: { lockedBalance: { decrement: amount }, balance: { increment: amount } } })
    })
  }
}
