import db from '../prisma'
import { setCache, CacheKeys } from '@sportsbook/redis-client'
import { createLogger } from '@sportsbook/logger'
import { OddsValidator } from '../validators/odds'
import { RiskValidator } from '../validators/risk'
import axios from 'axios'
import crypto from 'crypto'

const log = createLogger('betting-service')
const oddsValidator = new OddsValidator()
const riskValidator = new RiskValidator()
const WALLET_URL = process.env.WALLET_SERVICE_URL ?? 'http://localhost:3002'
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? 'change-me-internal-secret'

function generateBetReference(userId: string, selections: any[], totalStake: number): string {
  const bucket = Math.floor(Date.now() / 10000)
  const selHash = selections.map((s: any) => s.marketId + ':' + s.outcomeId).sort().join('|')
  const hash = crypto.createHash('sha256').update(userId + '|' + selHash + '|' + totalStake + '|' + bucket).digest('hex').slice(0, 12)
  return 'BET-' + hash
}

export class BettingService {
  async placeBet(input: any) {
    if (input.type === 'single' && input.selections.length > 1) {
      throw new Error('Single bet must have exactly 1 selection.')
    }
    for (const sel of input.selections) {
      const valid = await oddsValidator.validateOdds(sel.marketId, sel.outcomeId, sel.odds)
      if (!valid && !input.acceptOddsChanges) throw new Error('Odds have changed.')
    }
    const riskCheck = await riskValidator.checkBet(input)
    if (!riskCheck.approved) throw new Error('Bet rejected: ' + riskCheck.reason)

    const totalOdds = input.selections.reduce((acc: number, s: any) => acc * s.odds, 1)
    const potentialPayout = input.totalStake * totalOdds
    const reference = generateBetReference(input.userId, input.selections, input.totalStake)

    const betSlip = await db.betSlip.create({
      data: {
        userId: input.userId, type: input.type ?? 'single', totalStake: input.totalStake,
        potentialPayout, currency: input.currency ?? 'INR', status: 'pending',
        selections: { create: input.selections.map((s: any) => ({
          marketId: s.marketId, outcomeId: s.outcomeId, odds: s.odds, stake: s.stake, status: 'pending',
        })) },
      },
      include: { selections: true },
    })

    try {
      await axios.post(WALLET_URL + '/api/wallet/internal/debit', {
        userId: input.userId, amount: input.totalStake, type: 'bet', reference,
      }, { headers: { 'x-internal-secret': INTERNAL_SECRET }, timeout: 5000 })
    } catch (err: any) {
      await db.betSlip.delete({ where: { id: betSlip.id } }).catch(() => {})
      throw new Error(err.response?.data?.error ?? err.message ?? 'Wallet error')
    }

    const accepted = await db.betSlip.update({
      where: { id: betSlip.id }, data: { status: 'accepted' }, include: { selections: true },
    })
    await setCache(CacheKeys.activeSlip(input.userId), accepted, 3600)

    setImmediate(async () => {
      try {
        const { getProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await getProducer()
        await publish(producer, KAFKA_TOPICS.BET_PLACED, betSlip.id, {
          betSlipId: betSlip.id, userId: input.userId, totalStake: input.totalStake, potentialPayout, reference,
        })
      } catch (err) { log.warn({ err }, 'Failed to publish bet event') }
    })

    log.info({ betSlipId: betSlip.id, userId: input.userId, stake: input.totalStake }, 'Bet placed')
    return accepted
  }

  async cancelBet(betSlipId: string, userId: string) {
    const slip = await db.betSlip.findFirst({ where: { id: betSlipId, userId } })
    if (!slip) throw new Error('Bet not found')
    if (slip.status !== 'pending' && slip.status !== 'accepted') throw new Error('Cannot cancel settled bet')
    await db.betSlip.update({ where: { id: betSlipId }, data: { status: 'cancelled' } })
    try {
      await axios.post(WALLET_URL + '/api/wallet/internal/credit', {
        userId, amount: Number(slip.totalStake), type: 'refund', reference: 'REF-' + betSlipId,
      }, { headers: { 'x-internal-secret': INTERNAL_SECRET }, timeout: 5000 })
    } catch (err: any) { log.warn({ err }, 'Refund failed') }
    return { betSlipId, status: 'cancelled' }
  }

  async settleBet(betSlipId: string, winningOutcomeIds: string[]) {
    const slip = await db.betSlip.findUnique({ where: { id: betSlipId }, include: { selections: true } })
    if (!slip) throw new Error('Bet slip not found')
    const isWinner = slip.selections.every((s: any) => winningOutcomeIds.includes(s.outcomeId))
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
      try {
        await axios.post(WALLET_URL + '/api/wallet/internal/credit', {
          userId: slip.userId, amount: payout, type: 'win', reference: 'WIN-' + betSlipId,
        }, { headers: { 'x-internal-secret': INTERNAL_SECRET }, timeout: 5000 })
      } catch (err: any) { log.error({ err, betSlipId }, 'Win payout failed') }
    }

    setImmediate(async () => {
      try {
        const { getProducer, publish } = await import('@sportsbook/kafka-client')
        const { KAFKA_TOPICS } = await import('@sportsbook/shared-types')
        const producer = await getProducer()
        await publish(producer, KAFKA_TOPICS.BET_SETTLED, betSlipId, {
          betSlipId, userId: slip.userId, outcome: isWinner ? 'win' : 'loss', payout,
        })
      } catch (err) { log.warn({ err }, 'Failed to publish settle event') }
    })
    return { betSlipId, status, payout }
  }
}
