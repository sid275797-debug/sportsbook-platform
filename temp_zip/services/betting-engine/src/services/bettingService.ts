import db from '@sportsbook/db-client'
import { setCache, getCache, deleteCache, CacheKeys } from '@sportsbook/redis-client'
import { createProducer, publish } from '@sportsbook/kafka-client'
import { KAFKA_TOPICS, PlaceBetInput } from '@sportsbook/shared-types'
import { createLogger } from '@sportsbook/logger'
import { OddsValidator } from '../validators/odds'
import { RiskValidator } from '../validators/risk'
import axios from 'axios'

const log = createLogger('betting-service')
const oddsValidator = new OddsValidator()
const riskValidator = new RiskValidator()

export class BettingService {
  async placeBet(input: PlaceBetInput) {
    for (const sel of input.selections) {
      const valid = await oddsValidator.validateOdds(sel.marketId, sel.outcomeId, sel.odds)
      if (!valid && !input.acceptOddsChanges) {
        throw new Error(`Odds changed for outcome ${sel.outcomeId}`)
      }
    }

    const riskCheck = await riskValidator.checkBet(input)
    if (!riskCheck.approved) throw new Error(`Bet rejected: ${riskCheck.reason}`)

    const reference = `BET-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    await axios.post(`${process.env.WALLET_SERVICE_URL ?? 'http://localhost:3002'}/api/wallet/internal/debit`, {
      userId: input.userId, amount: input.totalStake, type: 'bet', reference,
    })

    const totalOdds = input.selections.reduce((acc: number, s: PlaceBetInput['selections'][number]) => acc * s.odds, 1)
    const potentialPayout = input.totalStake * totalOdds

    const betSlip = await db.betSlip.create({
      data: {
        userId: input.userId,
        type: input.type,
        totalStake: input.totalStake,
        potentialPayout,
        currency: input.currency,
        status: 'accepted',
        selections: {
          create: input.selections.map((s: PlaceBetInput['selections'][number]) => ({
            marketId: s.marketId, outcomeId: s.outcomeId,
            odds: s.odds, stake: s.stake, status: 'pending',
          })),
        },
      },
      include: { selections: true },
    })

    await setCache(CacheKeys.activeSlip(input.userId), betSlip, 3600)

    try {
      const producer = await createProducer()
      await publish(producer, KAFKA_TOPICS.BET_PLACED, betSlip.id, {
        betSlipId: betSlip.id, userId: input.userId,
        totalStake: input.totalStake, potentialPayout, reference,
      })
    } catch (err) { log.warn({ err }, 'Failed to publish bet event') }

    log.info({ betSlipId: betSlip.id, userId: input.userId }, 'Bet placed')
    return betSlip
  }

  async cancelBet(betSlipId: string, userId: string) {
    const slip = await db.betSlip.findFirst({ where: { id: betSlipId, userId } })
    if (!slip) throw new Error('Bet not found')
    if (slip.status !== 'pending' && slip.status !== 'accepted') throw new Error('Cannot cancel settled bet')
    await db.betSlip.update({ where: { id: betSlipId }, data: { status: 'cancelled' } })
    await axios.post(`${process.env.WALLET_SERVICE_URL ?? 'http://localhost:3002'}/api/wallet/internal/credit`, {
      userId, amount: Number(slip.totalStake), type: 'refund', reference: `REF-${betSlipId}`,
    })
    try {
      const producer = await createProducer()
      await publish(producer, KAFKA_TOPICS.BET_CANCELLED, betSlipId, { betSlipId, userId })
    } catch (err) { log.warn({ err }, 'Failed to publish cancel event') }
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

    await db.$transaction(async (tx: any) => {
      await tx.betSlip.update({ where: { id: betSlipId }, data: { status, settledAt: new Date() } })
      for (const sel of slip.selections) {
        await tx.betSelection.update({
          where: { id: sel.id },
          data: { status, result: winningOutcomeIds.includes((sel as any).outcomeId) ? 'win' : 'loss' },
        })
      }
    })

    if (isWinner) {
      await axios.post(`${process.env.WALLET_SERVICE_URL ?? 'http://localhost:3002'}/api/wallet/internal/credit`, {
        userId: slip.userId, amount: payout, type: 'win', reference: `WIN-${betSlipId}`,
      })
    }

    try {
      const producer = await createProducer()
      await publish(producer, KAFKA_TOPICS.BET_SETTLED, betSlipId, {
        betSlipId, userId: slip.userId, outcome: isWinner ? 'win' : 'loss', payout,
      })
    } catch (err) { log.warn({ err }, 'Failed to publish settle event') }

    return { betSlipId, status, payout }
  }
}
