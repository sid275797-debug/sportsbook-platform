import { UUID, Timestamp } from './common'

export type GameType = 'crash' | 'dice' | 'roulette' | 'blackjack' | 'plinko'
export type GameStatus = 'waiting' | 'running' | 'crashed' | 'completed'

export interface CrashRound {
  id: UUID
  roundNumber: number
  crashMultiplier: number
  serverSeed: string
  clientSeed: string
  hash: string
  status: GameStatus
  startedAt: Timestamp
  endedAt?: Timestamp
}

export interface CrashBet {
  id: UUID
  roundId: UUID
  userId: UUID
  stake: number
  cashoutMultiplier?: number
  payout?: number
  status: 'active' | 'cashed_out' | 'lost'
  placedAt: Timestamp
  cashedOutAt?: Timestamp
}

export interface DiceRound {
  id: UUID
  userId: UUID
  betAmount: number
  target: number
  rollOver: boolean
  result: number
  payout: number
  won: boolean
  serverSeed: string
  clientSeed: string
  nonce: number
  createdAt: Timestamp
}

export interface RouletteRound {
  id: UUID
  result: number
  bets: RouletteBet[]
  totalPayout: number
  createdAt: Timestamp
}

export interface RouletteBet {
  id: UUID
  userId: UUID
  betType: string
  amount: number
  numbers: number[]
  payout: number
  won: boolean
}
