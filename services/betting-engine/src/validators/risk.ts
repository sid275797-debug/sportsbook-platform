import { PlaceBetInput } from '@sportsbook/shared-types'
import axios from 'axios'
import { createLogger } from '@sportsbook/logger'
const log = createLogger('risk-validator')
interface RiskResult { approved: boolean; reason?: string }
export class RiskValidator {
  async checkBet(input: PlaceBetInput): Promise<RiskResult> {
    try {
      const { data } = await axios.post(process.env.RISK_ENGINE_URL + '/api/risk/check', input, { timeout: 3000 })
      return data
    } catch { log.warn('Risk engine unreachable - allowing bet'); return { approved: true } }
  }
}
