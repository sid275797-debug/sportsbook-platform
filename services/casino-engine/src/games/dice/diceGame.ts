import db from '../../prisma'
import { generateServerSeed, generateDiceResult } from '../../provably-fair'
import axios from 'axios'

const WALLET_URL = process.env.WALLET_SERVICE_URL ?? 'http://localhost:3002'
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET ?? 'change-me-internal-secret'
const H = { 'x-internal-secret': INTERNAL_SECRET }

export class DiceGame {
  async roll(userId: string, betAmount: number, target: number, rollOver: boolean, clientSeed: string) {
    const serverSeed = generateServerSeed()
    const nonce = await db.diceRound.count({ where: { userId } })
    const result = generateDiceResult(serverSeed, clientSeed, nonce)
    const won = rollOver ? result > target : result < target
    const probability = rollOver ? (100 - target) / 100 : target / 100
    const multiplier = (1 / probability) * 0.99
    const payout = won ? betAmount * multiplier : 0

    const round = await db.diceRound.create({ data: { userId, betAmount, target, rollOver, result, payout: 0, won: false, serverSeed, clientSeed, nonce } })
    try {
      await axios.post(WALLET_URL + '/api/wallet/internal/debit', { userId, amount: betAmount, type: 'bet', reference: 'DICE-' + round.id }, { headers: H, timeout: 5000 })
    } catch { await db.diceRound.delete({ where: { id: round.id } }).catch(() => {}); throw new Error('Wallet debit failed') }
    if (won) { try { await axios.post(WALLET_URL + '/api/wallet/internal/credit', { userId, amount: payout, type: 'win', reference: 'DICE-WIN-' + round.id }, { headers: H, timeout: 5000 }) } catch {} }
    return db.diceRound.update({ where: { id: round.id }, data: { payout, won } })
  }
}
