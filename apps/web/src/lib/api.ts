import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ─── Response interceptor: handle 401 refresh ─────────────────────────────────
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = []

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }
      originalRequest._retry = true
      isRefreshing = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
        const newToken = data.data?.accessToken || data.accessToken
        localStorage.setItem('accessToken', newToken)
        if (data.data?.refreshToken || data.refreshToken) {
          localStorage.setItem('refreshToken', data.data?.refreshToken || data.refreshToken)
        }
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        if (typeof window !== 'undefined') window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  logout: () => api.post('/auth/logout'),
}

// ─── Wallet API ───────────────────────────────────────────────────────────────
export const walletApi = {
  balance: () => api.get('/wallet/balance'),
  deposit: (data: { amount: number; method: string }) =>
    api.post('/wallet/deposit', data),
  withdraw: (data: { amount: number; method: string; accountDetails?: any }) =>
    api.post('/wallet/withdraw', data),
  transactions: (params?: { page?: number; limit?: number }) =>
    api.get('/wallet/transactions', { params }),
}

// ─── Betting API ──────────────────────────────────────────────────────────────
export const bettingApi = {
  placeBet: (data: {
    selections: Array<{
      marketId: string
      outcomeId: string
      odds: number
      stake: number
    }>
    totalStake: number
    currency: string
    type: 'single' | 'accumulator'
    acceptOddsChanges: boolean
  }) => api.post('/bets/place', data),
  myBets: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/bets/my-bets', { params }),
  betDetail: (id: string) => api.get(`/bets/${id}`),
}

// ─── Fixtures API ─────────────────────────────────────────────────────────────
export const fixturesApi = {
  upcoming: (params?: { sport?: string; limit?: number }) =>
    api.get('/fixtures/upcoming', { params }),
  live: () => api.get('/fixtures/live'),
  detail: (id: string) => api.get(`/fixtures/${id}`),
  markets: (id: string) => api.get(`/fixtures/${id}/markets`),
}

// ─── Cricket API ──────────────────────────────────────────────────────────────
export const cricketApi = {
  iplFixtures: () => api.get('/cricket/ipl/fixtures'),
  iplSchedule: () => api.get('/cricket/ipl/schedule'),
  iplPointsTable: () => api.get('/cricket/ipl/points-table'),
  matchMarkets: (id: string) => api.get(`/cricket/match/${id}/markets`),
  liveScores: () => api.get('/cricket/live'),
  matchDetail: (id: string) => api.get(`/cricket/match/${id}`),
  matchScorecard: (id: string) => api.get(`/cricket/match/${id}/scorecard`),
}

// ─── Casino API ───────────────────────────────────────────────────────────────
export const casinoApi = {
  crashBet: (data: { amount: number; autoCashout?: number }) =>
    api.post('/casino/crash/bet', data),
  crashCashout: (roundId: string) =>
    api.post('/casino/crash/cashout', { roundId }),
  crashHistory: () => api.get('/casino/crash/history'),
  diceBet: (data: { amount: number; target: number; direction: 'over' | 'under' }) =>
    api.post('/casino/dice/bet', data),
  diceHistory: () => api.get('/casino/dice/history'),
}

export default api
