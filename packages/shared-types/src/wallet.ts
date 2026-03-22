import { UUID, Timestamp, Currency } from './common'

export type TransactionType = 'deposit' | 'withdrawal' | 'bet' | 'win' | 'refund' | 'bonus' | 'transfer'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled'
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface Wallet {
  id: UUID
  userId: UUID
  currency: Currency
  balance: number
  lockedBalance: number
  bonusBalance: number
  updatedAt: Timestamp
}

export interface Transaction {
  id: UUID
  walletId: UUID
  userId: UUID
  type: TransactionType
  status: TransactionStatus
  amount: number
  currency: Currency
  balanceBefore: number
  balanceAfter: number
  reference: string
  metadata?: Record<string, unknown>
  createdAt: Timestamp
}

export interface DepositInput {
  userId: UUID
  amount: number
  currency: Currency
  provider: 'razorpay' | 'stripe' | 'crypto'
  metadata?: Record<string, unknown>
}

export interface WithdrawalInput {
  userId: UUID
  amount: number
  currency: Currency
  bankDetails?: BankDetails
  cryptoAddress?: string
}

export interface BankDetails {
  accountNumber: string
  ifscCode: string
  accountHolder: string
  bankName: string
}
