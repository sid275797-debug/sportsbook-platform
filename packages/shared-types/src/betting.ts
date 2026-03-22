import { UUID, Timestamp, Currency } from './common'

export type BetStatus = 'pending' | 'accepted' | 'settled_win' | 'settled_loss' | 'void' | 'cancelled'
export type BetType = 'single' | 'accumulator' | 'system'
export type OddsFormat = 'decimal' | 'fractional' | 'american'

export interface BetSlip {
  id: UUID
  userId: UUID
  type: BetType
  selections: BetSelection[]
  totalStake: number
  potentialPayout: number
  currency: Currency
  status: BetStatus
  placedAt: Timestamp
  settledAt?: Timestamp
}

export interface BetSelection {
  id: UUID
  betSlipId: UUID
  marketId: UUID
  outcomeId: UUID
  odds: number
  stake: number
  status: BetStatus
  result?: 'win' | 'loss' | 'void'
}

export interface PlaceBetInput {
  userId: UUID
  selections: PlaceBetSelectionInput[]
  totalStake: number
  currency: Currency
  type: BetType
  acceptOddsChanges?: boolean
}

export interface PlaceBetSelectionInput {
  marketId: UUID
  outcomeId: UUID
  odds: number
  stake: number
}
