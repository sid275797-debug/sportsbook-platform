import { UUID, Timestamp } from './common'
import { Transaction } from './wallet'
import { BetSlip } from './betting'
import { Outcome, LiveScore } from './market'
import { CrashRound } from './casino'

// Kafka topic names
export const KAFKA_TOPICS = {
  // Market events
  FIXTURE_CREATED: 'market.fixture.created',
  FIXTURE_UPDATED: 'market.fixture.updated',
  ODDS_UPDATED: 'market.odds.updated',
  MARKET_SETTLED: 'market.settled',
  LIVE_SCORE_UPDATED: 'market.live_score.updated',
  // Bet events
  BET_PLACED: 'bet.placed',
  BET_SETTLED: 'bet.settled',
  BET_CANCELLED: 'bet.cancelled',
  // Wallet events
  WALLET_CREDITED: 'wallet.credited',
  WALLET_DEBITED: 'wallet.debited',
  WITHDRAWAL_REQUESTED: 'wallet.withdrawal.requested',
  // Casino events
  CRASH_ROUND_STARTED: 'casino.crash.round_started',
  CRASH_ROUND_ENDED: 'casino.crash.round_ended',
  CRASH_BET_PLACED: 'casino.crash.bet_placed',
  CRASH_CASHOUT: 'casino.crash.cashout',
  // User events
  USER_REGISTERED: 'user.registered',
  USER_KYC_UPDATED: 'user.kyc.updated',
  // Risk events
  RISK_ALERT: 'risk.alert',
  BET_FLAGGED: 'risk.bet_flagged',
} as const

export type KafkaTopic = typeof KAFKA_TOPICS[keyof typeof KAFKA_TOPICS]

export interface KafkaMessage<T = unknown> {
  topic: KafkaTopic
  key: string
  value: T
  timestamp: Timestamp
  correlationId: UUID
}

export interface OddsUpdatedEvent {
  outcomeId: UUID
  marketId: UUID
  fixtureId: UUID
  oldOdds: number
  newOdds: number
  probability: number
  timestamp: Timestamp
}

export interface BetSettledEvent {
  betSlipId: UUID
  userId: UUID
  outcome: 'win' | 'loss' | 'void'
  payout: number
  timestamp: Timestamp
}

export interface CrashRoundEndedEvent {
  roundId: UUID
  crashMultiplier: number
  totalBets: number
  totalPayout: number
  timestamp: Timestamp
}
