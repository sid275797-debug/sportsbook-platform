import { PlaceBetInput } from '@sportsbook/shared-types'
import axios from 'axios'

interface RiskResult { approved: boolean; reason?: string }

export class RiskValidator {
  async checkBet(input: PlaceBetInput): Promise<RiskResult> {
    try {
      const { data } = await axios.post(`${process.env.RISK_ENGINE_URL}/api/risk/check`, input)
      return data
    } catch {
      // If risk engine is down, allow with warning
      return { approved: true }
    }
  }
}
