export class PayoutCalculator {
  calculateSinglePayout(stake: number, odds: number): number {
    return stake * odds
  }

  calculateAccumulatorPayout(stake: number, oddsArray: number[]): number {
    const totalOdds = oddsArray.reduce((acc, o) => acc * o, 1)
    return stake * totalOdds
  }

  calculateVoidRefund(stake: number): number {
    return stake
  }

  applyMargin(probability: number, margin: number): number {
    return probability / (1 + margin)
  }
}
