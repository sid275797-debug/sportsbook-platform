import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Auth Store ───────────────────────────────────────────────────────────────

interface User {
  id: string
  username: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  balance: number
  setAuth: (user: User, token: string) => void
  setBalance: (amount: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      balance: 0,
      setAuth: (user, token) => set({ user, token }),
      setBalance: (balance) => set({ balance }),
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
        }
        set({ user: null, token: null, balance: 0 })
        window.location.href = '/login'
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, token: s.token, balance: s.balance }) }
  )
)

// ─── Betslip Store ────────────────────────────────────────────────────────────

interface BetSelection {
  fixtureId: string
  marketId: string
  outcomeId: string
  label: string
  odds: number
}

interface BetslipState {
  selections: BetSelection[]
  addSelection: (s: BetSelection) => void
  removeSelection: (outcomeId: string) => void
  isSelected: (outcomeId: string) => boolean
  clearAll: () => void
}

export const useBetslipStore = create<BetslipState>()((set, get) => ({
  selections: [],
  addSelection: (s) =>
    set((state) => {
      // Replace if same fixture already has a selection in that market
      const filtered = state.selections.filter(
        (x) => !(x.fixtureId === s.fixtureId && x.marketId === s.marketId)
      )
      return { selections: [...filtered, s] }
    }),
  removeSelection: (outcomeId) =>
    set((state) => ({ selections: state.selections.filter((s) => s.outcomeId !== outcomeId) })),
  isSelected: (outcomeId) => get().selections.some((s) => s.outcomeId === outcomeId),
  clearAll: () => set({ selections: [] }),
}))
