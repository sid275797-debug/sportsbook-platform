import axios, { AxiosInstance } from 'axios'

const BASE = process.env.NEXT_PUBLIC_GATEWAY_URL ?? 'http://localhost:4000'

function createClient(): AxiosInstance {
  const client = axios.create({ baseURL: BASE, timeout: 10_000 })

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken')
      if (token) config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  client.interceptors.response.use(
    (r) => r,
    async (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          try {
            const { data } = await axios.post(`${BASE}/api/auth/refresh`, { refreshToken })
            localStorage.setItem('accessToken', data.data.accessToken)
            localStorage.setItem('refreshToken', data.data.refreshToken)
            err.config.headers.Authorization = `Bearer ${data.data.accessToken}`
            return client.request(err.config)
          } catch {
            localStorage.clear()
            window.location.href = '/login'
          }
        }
      }
      return Promise.reject(err)
    }
  )
  return client
}

const api = createClient()

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (body: { email: string; password: string }) => api.post('/api/auth/login', body),
  register: (body: { username: string; email: string; password: string; phone?: string; referralCode?: string }) =>
    api.post('/api/auth/register', body),
  me:       () => api.get('/api/auth/me'),
  refresh:  (refreshToken: string) => api.post('/api/auth/refresh', { refreshToken }),
  logout:   (refreshToken: string) => api.post('/api/auth/logout', { refreshToken }),
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
export const fixturesApi = {
  // GET /api/fixtures/live
  live: (sport?: string) =>
    api.get('/api/fixtures/live', { params: sport ? { sport } : undefined }),
  // GET /api/fixtures/upcoming  (added to market-service)
  upcoming: (params?: Record<string, any>) =>
    api.get('/api/fixtures/upcoming', { params }),
  // GET /api/fixtures/:id
  byId: (id: string) => api.get(`/api/fixtures/${id}`),
}

// ─── Markets ──────────────────────────────────────────────────────────────────
export const marketApi = {
  market: (marketId: string) => api.get(`/api/markets/${marketId}`),
  sports: () => api.get('/api/sports'),
}

// ─── Betting ──────────────────────────────────────────────────────────────────
// POST /api/bets/place           → betting-engine bet.ts
// GET  /api/history              → betting-engine historyRoutes /api/history
// GET  /api/slips/:id            → betting-engine slipRoutes /api/slips
// GET  /api/slips/active         → betting-engine slipRoutes /api/slips/active
export const bettingApi = {
  placeBet: (body: {
    selections: Array<{ marketId: string; outcomeId: string; odds: number; stake: number }>
    totalStake: number
    currency?: string
    type?: 'single' | 'accumulator'
    acceptOddsChanges?: boolean
  }) =>
    api.post('/api/bets/place', {
      currency: 'INR',
      type: (body.selections?.length ?? 0) > 1 ? 'accumulator' : 'single',
      acceptOddsChanges: false,
      ...body,
    }),
  myBets: (page = 1, status?: string) =>
    api.get('/api/history', { params: { page, limit: 20, ...(status ? { status } : {}) } }),
  betById:     (id: string) => api.get(`/api/slips/${id}`),
  activeSlips: ()           => api.get('/api/slips/active'),
  cancelBet:   (id: string) => api.post(`/api/bets/${id}/cancel`),
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
// GET  /api/wallet/balance
// POST /api/wallet/deposit/initiate
// POST /api/wallet/withdrawal/request
// GET  /api/wallet/transactions
export const walletApi = {
  balance: () => api.get('/api/wallet/balance'),
  deposit: (body: { amount: number; provider?: string; currency?: string }) =>
    api.post('/api/wallet/deposit/initiate', {
      currency: 'INR',
      provider: 'razorpay',
      ...body,
    }),
  withdraw: (body: { amount: number; method?: string; upiId?: string; bankAccount?: string }) =>
    api.post('/api/wallet/withdrawal/request', {
      amount:  body.amount,
      method:  body.method ?? 'upi',
      upiId:   body.upiId ?? body.bankAccount,
    }),
  history: (page = 1, type?: string) =>
    api.get('/api/wallet/transactions', { params: { page, limit: 20, ...(type ? { type } : {}) } }),
}

// ─── Casino ───────────────────────────────────────────────────────────────────
// GET  /api/casino/crash/history
// GET  /api/casino/crash/current
// POST /api/casino/crash/bet          { stake, roundId }
// POST /api/casino/crash/cashout      { roundId }
// POST /api/casino/dice/roll          { betAmount, target, rollOver, clientSeed }
// POST /api/casino/roulette/spin      { bets: [{ betType, amount, numbers }] }
export const casinoApi = {
  crashHistory: () => api.get('/api/casino/crash/history'),
  crashCurrent: () => api.get('/api/casino/crash/current'),
  crashBet:     (body: { stake: number; roundId: string }) =>
    api.post('/api/casino/crash/bet', body),
  crashCashout: (body: { roundId: string }) =>
    api.post('/api/casino/crash/cashout', body),
  // rollOver matches backend field name (was incorrectly isOver in old code)
  diceRoll: (body: { betAmount: number; target: number; rollOver: boolean; clientSeed?: string }) =>
    api.post('/api/casino/dice/roll', {
      clientSeed: Math.random().toString(36).slice(2),
      ...body,
    }),
  rouletteSpin: (body: { bets: Array<{ betType: string; amount: number; numbers: number[] }> }) =>
    api.post('/api/casino/roulette/spin', body),
}

export default api
