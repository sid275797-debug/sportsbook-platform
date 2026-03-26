import db from '../../prisma'
import axios from 'axios'
import crypto from 'crypto'

const PAYOUTS: Record<string, number> = {
  straight: 35, split: 17, street: 11, corner: 8,
  line: 5, dozen: 2, column: 2, red: 1, black: 1,
  odd: 1, even: 1, low: 1, high: 1,
}

const RED_NUMBERS = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]

export class RouletteGame {
  async spin(bets: Array<{ userId: string; betType: string; amount: number; numbers: number[] }>) {
    const result = crypto.randomInt(0, 37)  // 0-36

    const settleBets = bets.map((bet) => {
      const won = this.checkWin(bet.betType, bet.numbers, result)
      const multiplier = PAYOUTS[bet.betType] ?? 1
      const payout = won ? bet.amount * (multiplier + 1) : 0
      return { ...bet, payout, won }
    })

    const totalPayout = settleBets.reduce((sum, b) => sum + b.payout, 0)

    const round = await db.rouletteRound.create({
      data: {
        result, totalPayout,
        bets: {
          create: settleBets.map((b) => ({
            userId: b.userId, betType: b.betType,
            amount: b.amount, numbers: b.numbers,
            payout: b.payout, won: b.won,
          })),
        },
      },
      include: { bets: true },
    })

    // Process wallet changes
    for (const bet of settleBets) {
      await axios.post(`${process.env.WALLET_SERVICE_URL}/api/wallet/internal/debit`, {
        userId: bet.userId, amount: bet.amount, type: 'bet', reference: `ROULETTE-${round.id}-${bet.userId}`,
      })
      if (bet.won) {
        await axios.post(`${process.env.WALLET_SERVICE_URL}/api/wallet/internal/credit`, {
          userId: bet.userId, amount: bet.payout, type: 'win', reference: `ROULETTE-WIN-${round.id}`,
        })
      }
    }

    return { round, result }
  }

  private checkWin(betType: string, numbers: number[], result: number): boolean {
    switch (betType) {
      case 'straight': return numbers.includes(result)
      case 'red': return RED_NUMBERS.includes(result)
      case 'black': return result !== 0 && !RED_NUMBERS.includes(result)
      case 'odd': return result !== 0 && result % 2 !== 0
      case 'even': return result !== 0 && result % 2 === 0
      case 'low': return result >= 1 && result <= 18
      case 'high': return result >= 19 && result <= 36
      case 'dozen': return numbers.length === 1 && Math.ceil(result / 12) === numbers[0]
      default: return numbers.includes(result)
    }
  }
}
