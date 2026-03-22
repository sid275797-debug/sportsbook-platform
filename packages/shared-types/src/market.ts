import { UUID, Timestamp } from './common'

export type MarketStatus = 'upcoming' | 'live' | 'suspended' | 'settled' | 'cancelled'
export type SportType = 'cricket' | 'football' | 'basketball' | 'tennis' | 'kabaddi' | 'hockey'

export interface Sport {
  id: UUID
  name: string
  type: SportType
  isActive: boolean
}

export interface Fixture {
  id: UUID
  sportId: UUID
  homeTeam: Team
  awayTeam: Team
  startTime: Timestamp
  status: MarketStatus
  liveScore?: LiveScore
  venue?: string
}

export interface Team {
  id: UUID
  name: string
  shortName: string
  logoUrl?: string
}

export interface Market {
  id: UUID
  fixtureId: UUID
  name: string
  type: string
  status: MarketStatus
  outcomes: Outcome[]
  inPlay: boolean
  createdAt: Timestamp
}

export interface Outcome {
  id: UUID
  marketId: UUID
  name: string
  odds: number
  probability: number
  isActive: boolean
  result?: boolean
}

export interface LiveScore {
  homeScore: number
  awayScore: number
  period: string
  minute?: number
  extraInfo?: Record<string, unknown>
}
