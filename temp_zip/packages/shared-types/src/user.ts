import { UUID, Timestamp, Status } from './common'

export type UserRole = 'user' | 'admin' | 'trader' | 'support' | 'agent'
export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected'

export interface User {
  id: UUID
  email: string
  phone?: string
  username: string
  role: UserRole
  kycStatus: KycStatus
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Session {
  id: UUID
  userId: UUID
  token: string
  refreshToken: string
  ipAddress: string
  userAgent: string
  expiresAt: Timestamp
  createdAt: Timestamp
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterInput {
  email: string
  password: string
  username: string
  phone?: string
  referralCode?: string
}

export interface LoginInput {
  email: string
  password: string
}
