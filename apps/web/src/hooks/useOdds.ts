import { useState, useEffect } from 'react'
import { marketApi } from '../lib/api'

export function useOdds(marketId: string) {
  const [odds, setOdds] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!marketId) return
    const fetchOdds = async () => {
      try {
        const { data } = await marketApi.market(marketId)
        setOdds(data.data)
      } finally { setLoading(false) }
    }
    fetchOdds()
    const interval = setInterval(fetchOdds, 10000) // refresh every 10s
    return () => clearInterval(interval)
  }, [marketId])

  return { odds, loading }
}
