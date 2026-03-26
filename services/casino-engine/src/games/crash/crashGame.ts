import crypto from 'crypto'
import { createLogger } from '@sportsbook/logger'
import db from '../../prisma'
import { generateServerSeed, generateCrashPoint } from '../../provably-fair'
import { wsClients } from '../../websocket/handler'
import { createProducer, publish } from '@sportsbook/kafka-client'
import { KAFKA_TOPICS } from '@sportsbook/shared-types'
import axios from 'axios'

const log = createLogger('crash-game')

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export class CrashGame {
  private currentRoundId: string | null = null
  private multiplier = 1.0
  private interval: ReturnType<typeof setInterval> | null = null
  private roundNumber = 0
  private initialized = false

  async start() {
    // Read the highest existing round number from DB to avoid unique constraint conflicts
    try {
      const lastRound = await db.crashRound.findFirst({
        orderBy: { roundNumber: 'desc' },
        select: { roundNumber: true },
      })
      this.roundNumber = lastRound?.roundNumber ?? 0
      log.info({ startingFromRound: this.roundNumber }, 'Crash game loop started')
    } catch {
      log.info('Crash game loop started (fresh)')
    }
    this.initialized = true
    this.runRound()
  }

  private async runRound() {
    try {
      await this.waitingPhase()
      await this.runningPhase()
      await this.endPhase()
    } catch (err) {
      log.error({ err }, 'Round error')
    }
    setTimeout(() => this.runRound(), 1000)
  }

  private async waitingPhase() {
    this.broadcast({ type: 'WAITING', duration: 5000 })
    await sleep(5000)
  }

  private async runningPhase() {
    this.roundNumber++
    const serverSeed = generateServerSeed()
    const clientSeed = `round-${this.roundNumber}`
    const crashPoint = generateCrashPoint(serverSeed, clientSeed, this.roundNumber)
    const hash = crypto.createHash('sha256').update(serverSeed).digest('hex')

    const round = await db.crashRound.create({
      data: {
        roundNumber: this.roundNumber, serverSeed, clientSeed,
        hash, crashMultiplier: crashPoint, status: 'running', startedAt: new Date(),
      },
    })
    this.currentRoundId = round.id
    this.multiplier = 1.0

    this.broadcast({ type: 'ROUND_START', roundId: round.id, roundNumber: this.roundNumber })

    return new Promise<void>((resolve) => {
      this.interval = setInterval(async () => {
        this.multiplier = Math.round((this.multiplier + 0.01 + this.multiplier * 0.002) * 100) / 100
        this.broadcast({ type: 'MULTIPLIER', value: this.multiplier })
        if (this.multiplier >= crashPoint) {
          clearInterval(this.interval!)
          resolve()
        }
      }, 100)
    })
  }

  private async endPhase() {
    if (!this.currentRoundId) return
    await db.crashRound.update({
      where: { id: this.currentRoundId },
      data: { status: 'crashed', endedAt: new Date() },
    })

    const activeBets = await db.crashBet.findMany({ where: { roundId: this.currentRoundId, status: 'active' } })
    for (const bet of activeBets) {
      await db.crashBet.update({ where: { id: bet.id }, data: { status: 'lost' } })
    }

    this.broadcast({ type: 'CRASHED', multiplier: this.multiplier, roundId: this.currentRoundId })

    try {
      const producer = await createProducer()
      await publish(producer, KAFKA_TOPICS.CRASH_ROUND_ENDED, this.currentRoundId, {
        roundId: this.currentRoundId, crashMultiplier: this.multiplier,
        totalBets: activeBets.length,
      })
    } catch (err) { log.warn({ err }, 'Failed to publish crash event') }

    log.info({ roundId: this.currentRoundId, crashMultiplier: this.multiplier }, 'Round crashed')
    this.currentRoundId = null
    this.multiplier = 1.0
  }

  async placeBet(userId: string, stake: number, roundId: string) {
    const round = await db.crashRound.findUnique({ where: { id: roundId } })
    if (!round || round.status !== 'running') throw new Error('Round not accepting bets')
    try {
      await axios.post(`${process.env.WALLET_SERVICE_URL}/api/wallet/internal/debit`, {
        userId, amount: stake, type: 'bet', reference: `CRASH-${Date.now()}`,
      })
    } catch { throw new Error('Wallet debit failed') }
    const bet = await db.crashBet.create({ data: { roundId, userId, stake, status: 'active' } })
    const client = [...wsClients].find((c: any) => c.userId === userId) as any
    this.broadcast({ type: 'BET_PLACED', userId, username: client?.username ?? 'player', stake })
    return bet
  }

  async cashout(userId: string, roundId: string) {
    if (roundId !== this.currentRoundId) throw new Error('Round has ended')
    const bet = await db.crashBet.findFirst({ where: { roundId, userId, status: 'active' } })
    if (!bet) throw new Error('No active bet found')
    const payout = Number(bet.stake) * this.multiplier
    await db.crashBet.update({
      where: { id: bet.id },
      data: { status: 'cashed_out', cashoutMultiplier: this.multiplier, payout, cashedOutAt: new Date() },
    })
    try {
      await axios.post(`${process.env.WALLET_SERVICE_URL}/api/wallet/internal/credit`, {
        userId, amount: payout, type: 'win', reference: `CRASH-WIN-${bet.id}`,
      })
    } catch { throw new Error('Wallet credit failed') }
    this.broadcast({ type: 'CASHOUT', userId, multiplier: this.multiplier, payout })
    return { multiplier: this.multiplier, payout }
  }

  private broadcast(data: unknown) {
    const msg = JSON.stringify(data)
    wsClients.forEach((client: any) => { if (client.readyState === 1) client.send(msg) })
  }

  getCurrentRoundId() { return this.currentRoundId }
  getCurrentMultiplier() { return this.multiplier }
}
