import db from './prisma'
import { setCache, CacheKeys } from '@sportsbook/redis-client'
import { createLogger } from '@sportsbook/logger'
import { OddsValidator } from '../validators/odds'
import { RiskValidator } from '../validators/risk'
import axios from 'axios'

const log = createLogger('betting-service')
const oddsValidator = new OddsValidator()
const riskValidator = new RiskValidator()

const WALLET_URL = process.env.WALLET_SERVICE_URL ?? 'http://localhost:3002'

export class BettingService {
  async placeBet(input: any) {
    // Validate odds (with fallback â€” never block bet if market-service unreachable)
    for (const sel of input.selections) {
      const valid = await oddsValidator.validateOdds(sel.marketId, sel.outcomeId, sel.odds)
      if (!valid && !input.acceptOddsChanges) {
        throw new Error('Odds have changed. Please refresh and try again.')
      }
    }

    // Risk check (fails open â€” if risk engine down, allow bet)
    const riskCheck = await riskValidator.checkBet(input)
    if (!riskCheck.approved) throw new Error('Bet rejected: ' + riskCheck.reason)

    // Debit wallet FIRST â€” fail fast if insufficient balance
    const reference = 'BET-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    try {
      await axios.post(WALLET_URL + '/api/wallet/internal/debit', {
        userId: input.userId,
        amount: input.totalStake,
        type: 'bet',
        reference,
      })
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Wallet error'
      throw new Error(msg)
    }

    // Calculate payout
    const totalOdds = input.selections.reduce((acc: number, s: any) => acc * s.odds, 1)
    const potentialPayout = input.totalStake * totalOdds

    // Create bet slip in DB
    const betSlip = await db.betSlip.create({
      data: {
        userId: input.userId,
        type: input.type ?? 'single',
        totalStake: input.totalStake,
        potentialPayout,
        currency: input.currency ?? 'INR',
        status: 'accepted',
        selections: {
          create: input.selections.map((s: any) => ({
            marketId: s.marketId,
            outcomeId: s.outcomeId,
            odds: s.odds,
            stake: s.stake,
            status: 'pending',
          })),
        },
      },
      include: { selections: true },
    })

    await setCache(CacheKeys.activeSlip(input.userId), betSlip, 3600)

    // Fire-and-forget Kafka publish
    setImmediate(async () => {
      try {
        const { createProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.BET_PLACED, betSlip.id, {
          betSlipId: betSlip.id, userId: input.userId,
          totalStake: input.totalStake, potentialPayout, reference,
        })
        await producer.disconnect()
      } catch (err) { log.warn({ err }, 'Failed to publish bet event') }
    })

    log.info({ betSlipId: betSlip.id, userId: input.userId, stake: input.totalStake }, 'Bet placed')
    return betSlip
  }

  async cancelBet(betSlipId: string, userId: string) {
    const slip = await db.betSlip.findFirst({ where: { id: betSlipId, userId } })
    if (!slip) throw new Error('Bet not found')
    if (slip.status !== 'pending' && slip.status !== 'accepted') throw new Error('Cannot cancel settled bet')
    await db.betSlip.update({ where: { id: betSlipId }, data: { status: 'cancelled' } })
    // Refund wallet
    try {
      await axios.post(WALLET_URL + '/api/wallet/internal/credit', {
        userId, amount: Number(slip.totalStake), type: 'refund', reference: 'REF-' + betSlipId,
      })
    } catch (err: any) {
      log.warn({ err }, 'Refund failed during cancel')
    }
    setImmediate(async () => {
      try {
        const { createProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.BET_CANCELLED, betSlipId, { betSlipId, userId })
        await producer.disconnect()
      } catch (err) { log.warn({ err }, 'Failed to publish cancel event') }
    })
    return { betSlipId, status: 'cancelled' }
  }

  async settleBet(betSlipId: string, winningOutcomeIds: string[]) {
    const slip = await db.betSlip.findUnique({ where: { id: betSlipId }, include: { selections: true } })
    if (!slip) throw new Error('Bet slip not found')

    const isWinner = slip.type === 'single'
      ? slip.selections.some((s: any) => winningOutcomeIds.includes(s.outcomeId))
      : slip.selections.every((s: any) => winningOutcomeIds.includes(s.outcomeId))

    const status = isWinner ? 'settled_win' : 'settled_loss'
    const payout = isWinner ? Number(slip.potentialPayout) : 0

    await db.(async (tx: any) => {
      await tx.betSlip.update({ where: { id: betSlipId }, data: { status, settledAt: new Date() } })
      for (const sel of slip.selections) {
        await tx.betSelection.update({
          where: { id: sel.id },
          data: { status, result: winningOutcomeIds.includes((sel as any).outcomeId) ? 'win' : 'loss' },
        })
      }
    })

    if (isWinner) {
      try {
        await axios.post(WALLET_URL + '/api/wallet/internal/credit', {
          userId: slip.userId, amount: payout, type: 'win', reference: 'WIN-' + betSlipId,
        })
      } catch (err: any) {
        log.warn({ err }, 'Win payout failed')
      }
    }

    setImmediate(async () => {
      try {
        const { createProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await createProducer()
        await publish(producer, KAFKA_TOPICS.BET_SETTLED, betSlipId, {
          betSlipId, userId: slip.userId, outcome: isWinner ? 'win' : 'loss', payout,
        })
        await producer.disconnect()
      } catch (err) { log.warn({ err }, 'Failed to publish settle event') }
    })

    return { betSlipId, status, payout }
  }
}