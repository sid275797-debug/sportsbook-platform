export type UUID = string
export type Timestamp = string

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Timestamp
}

export type Currency = 'INR' | 'USD' | 'EUR' | 'BTC' | 'ETH' | 'USDT'
export type Status = 'active' | 'inactive' | 'suspended' | 'pending'
