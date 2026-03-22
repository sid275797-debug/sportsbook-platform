import db from '@sportsbook/db-client'
import { generateServerSeed, generateDiceResult } from '../../provably-fair'
import axios from 'axios'

export class DiceGame {
  async roll(userId: string, betAmount: number, target: number, rollOver: boolean, clientSeed: string) {
    const serverSeed = generateServerSeed()
    const nonce = await db.diceRound.count({ where: { userId } })
    const result = generateDiceResult(serverSeed, clientSeed, nonce)

    const won = rollOver ? result > target : result < target
    const probability = rollOver ? (100 - target) / 100 : target / 100
    const multiplier = (1 / probability) * 0.99  // 1% house edge
    const payout = won ? betAmount * multiplier : 0

    if (won) {
      await axios.post(`${process.env.WALLET_SERVICE_URL}/api/wallet/internal/debit`, {
        userId, amount: betAmount, type: 'bet', reference: `DICE-${Date.now()}`,
      })
      await axios.post(`${process.env.WALLET_SERVICE_URL}/api/wallet/internal/credit`, {
        userId, amount: payout, type: 'win', reference: `DICE-WIN-${Date.now()}`,
      })
    } else {
      await axios.post(`${process.env.WALLET_SERVICE_URL}/api/wallet/internal/debit`, {
        userId, amount: betAmount, type: 'bet', reference: `DICE-${Date.now()}`,
      })
    }

    return db.diceRound.create({
      data: { userId, betAmount, target, rollOver, result, payout, won, serverSeed, clientSeed, nonce },
    })
  }
}
