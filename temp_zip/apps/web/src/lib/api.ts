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
  register: (body: { username: string; email: string; password: string }) => api.post('/api/auth/register', body),
  me:       () => api.get('/api/auth/me'),
  refresh:  (refreshToken: string) => api.post('/api/auth/refresh', { refreshToken }),
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
export const fixturesApi = {
  live:       (sport?: string) => api.get('/api/fixtures/live', { params: sport ? { sport } : undefined }),
  upcoming:   (params?: Record<string, any>) => api.get('/api/fixtures/upcoming', { params }),
  byId:       (id: string) => api.get(`/api/fixtures/${id}?includeMarkets=true`),
  markets:    (fixtureId: string) => api.get(`/api/fixtures/${fixtureId}/markets`),
}

// ─── Markets ──────────────────────────────────────────────────────────────────
export const marketApi = {
  market:  (marketId: string) => api.get(`/api/markets/${marketId}`),
  sports:  () => api.get('/api/sports'),
}

// ─── Betting ──────────────────────────────────────────────────────────────────
export const bettingApi = {
  placeBet:  (body: any)    => api.post('/api/bets', body),
  myBets:    (page = 1)     => api.get('/api/bets/my', { params: { page } }),
  betById:   (id: string)   => api.get(`/api/bets/${id}`),
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export const walletApi = {
  balance:   () => api.get('/api/wallet/balance'),
  deposit:   (body: { amount: number; provider: string }) => api.post('/api/wallet/deposit', body),
  withdraw:  (body: { amount: number; bankAccount: string }) => api.post('/api/wallet/withdraw', body),
  history:   (page = 1) => api.get('/api/wallet/transactions', { params: { page } }),
}

// ─── Casino ───────────────────────────────────────────────────────────────────
export const casinoApi = {
  // Crash
  crashHistory: ()       => api.get('/api/casino/crash/history'),
  crashCurrent: ()       => api.get('/api/casino/crash/current'),
  crashBet:     (body: { stake: number; roundId: string }) => api.post('/api/casino/crash/bet', body),
  crashCashout: (body: { roundId: string })                => api.post('/api/casino/crash/cashout', body),
  // Dice
  diceRoll: (body: { betAmount: number; target: number; isOver: boolean }) => api.post('/api/casino/dice/roll', body),
  // Roulette
  rouletteSpin: (body: { bets: Array<{ type: string; value: any; amount: number }> }) => api.post('/api/casino/roulette/spin', body),
}

export default api
