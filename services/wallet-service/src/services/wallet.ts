import db from '../prisma'
import { setCache, deleteCache, CacheKeys } from '@sportsbook/redis-client'
import { createProducer, publish } from '@sportsbook/kafka-client'
import { KAFKA_TOPICS } from '@sportsbook/shared-types'
import { createLogger } from '@sportsbook/logger'

const log = createLogger('wallet-service')

export class WalletService {
  async getOrCreateWallet(userId: string, currency = 'INR') {
    let wallet = await db.wallet.findUnique({ where: { userId } })
    if (!wallet) {
      wallet = await db.wallet.create({ data: { userId, currency } })
    }
    return wallet
  }

  async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId)
    return {
      available: Number(wallet.balance),
      locked: Number(wallet.lockedBalance),
      bonus: Number(wallet.bonusBalance),
      total: Number(wallet.balance) + Number(wallet.bonusBalance),
    }
  }

  async credit(userId: string, amount: number, type: string, reference: string, metadata?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet) throw new Error(`Wallet not found for user ${userId}`)
      const balanceBefore = Number(wallet.balance)
      const balanceAfter = balanceBefore + amount
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } })
      const txn = await tx.transaction.create({
        data: {
          walletId: wallet.id, userId, type, status: 'completed',
          amount, currency: wallet.currency,
          balanceBefore, balanceAfter, reference,
          metadata: metadata as any,
        },
      })
      await deleteCache(CacheKeys.wallet(userId))
      log.info({ userId, amount, type }, 'Wallet credited')
      try {
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.WALLET_CREDITED, userId, { userId, amount, type, reference, balanceAfter })
      } catch (err) { log.warn({ err }, 'Failed to publish wallet event') }
      return txn
    })
  }

  async debit(userId: string, amount: number, type: string, reference: string, metadata?: Record<string, unknown>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet) throw new Error('Wallet not found')
      if (Number(wallet.balance) < amount) throw new Error('Insufficient balance')
      const balanceBefore = Number(wallet.balance)
      const balanceAfter = balanceBefore - amount
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount } } })
      const txn = await tx.transaction.create({
        data: {
          walletId: wallet.id, userId, type, status: 'completed',
          amount, currency: wallet.currency,
          balanceBefore, balanceAfter, reference,
          metadata: metadata as any,
        },
      })
      await deleteCache(CacheKeys.wallet(userId))
      log.info({ userId, amount, type }, 'Wallet debited')
      try {
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.WALLET_DEBITED, userId, { userId, amount, type, reference, balanceAfter })
      } catch (err) { log.warn({ err }, 'Failed to publish wallet event') }
      return txn
    })
  }

  async lockFunds(userId: string, amount: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.$transaction(async (tx: any) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } })
      if (!wallet || Number(wallet.balance) < amount) throw new Error('Insufficient funds to lock')
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount }, lockedBalance: { increment: amount } },
      })
    })
  }

  async unlockFunds(userId: string, amount: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.$transaction(async (tx: any) => {
      await tx.wallet.update({
        where: { userId },
        data: { lockedBalance: { decrement: amount }, balance: { increment: amount } },
      })
    })
  }
}
