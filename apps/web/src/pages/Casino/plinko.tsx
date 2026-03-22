'use client'
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { useAuthStore } from '../../store'
import api from '../../lib/api'

const ROWS = 12
const MULTIPLIERS_LOW: number[] = [0.2, 0.3, 0.5, 0.5, 1, 1, 1, 1, 0.5, 0.5, 0.3, 0.2]
const MULTIPLIERS_MED: number[] = [0.2, 0.5, 1, 1.5, 2, 3, 2, 1.5, 1, 0.5, 0.2, 0.2]
const MULTIPLIERS_HIGH: number[] = [0.2, 0.5, 1, 2, 5, 10, 5, 2, 1, 0.5, 0.2, 0.2]

const SLOT_COLORS = ['#e03f3f','#e03f3f','#f0a500','#f0a500','#22c55e','#00d4aa','#22c55e','#f0a500','#f0a500','#e03f3f','#e03f3f','#e03f3f']

type Risk = 'low' | 'medium' | 'high'

export default function PlinkoPage() {
  const { user, balance, setBalance } = useAuthStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stake, setStake]   = useState('100')
  const [risk, setRisk]     = useState<Risk>('medium')
  const [dropping, setDropping] = useState(false)
  const [result, setResult] = useState<{ slot: number; multiplier: number; payout: number } | null>(null)
  const [history, setHistory] = useState<Array<{ multiplier: number; won: boolean }>>([])
  const [error, setError]   = useState('')

  const multipliers = risk === 'low' ? MULTIPLIERS_LOW : risk === 'medium' ? MULTIPLIERS_MED : MULTIPLIERS_HIGH

  // Draw pegs
  useEffect(() => {
    drawBoard()
  }, [risk])

  function drawBoard(ballX?: number, ballY?: number, slot?: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const pegR = 4
    const startY = 40
    const rowH = (H - startY - 70) / ROWS

    // Draw pegs
    for (let row = 0; row < ROWS; row++) {
      const pegsInRow = row + 3
      const spacing = W / (pegsInRow + 1)
      for (let col = 0; col < pegsInRow; col++) {
        const px = spacing * (col + 1)
        const py = startY + row * rowH
        ctx.beginPath()
        ctx.arc(px, py, pegR, 0, Math.PI * 2)
        ctx.fillStyle = '#2e3540'
        ctx.fill()
        ctx.strokeStyle = '#4a5568'
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Draw slots
    const slotCount = multipliers.length
    const slotW = W / slotCount
    const slotY = H - 50
    multipliers.forEach((m, i) => {
      const sx = i * slotW
      const highlight = slot === i
      ctx.fillStyle = highlight ? SLOT_COLORS[i] : SLOT_COLORS[i] + '55'
      ctx.fillRect(sx + 2, slotY, slotW - 4, 36)
      ctx.fillStyle = '#fff'
      ctx.font = `bold 10px monospace`
      ctx.textAlign = 'center'
      ctx.fillText(`${m}×`, sx + slotW / 2, slotY + 22)
    })

    // Draw ball
    if (ballX !== undefined && ballY !== undefined) {
      ctx.beginPath()
      ctx.arc(ballX, ballY, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#00d4aa'
      ctx.shadowColor = '#00d4aa'
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  async function drop() {
    const amt = parseFloat(stake)
    if (!user) { setError('Log in to play'); return }
    if (!amt || amt < 10) { setError('Min stake ₹10'); return }
    if (amt > balance) { setError('Insufficient balance'); return }
    setError('')
    setDropping(true)
    setBalance(balance - amt)

    const canvas = canvasRef.current
    if (!canvas) return
    const W = canvas.width, H = canvas.height
    const startY = 40
    const rowH = (H - startY - 70) / ROWS

    // Simulate ball path
    let path = 0 // 0 = left half start
    const moves: boolean[] = []
    for (let i = 0; i < ROWS; i++) {
      const goRight = Math.random() > 0.5
      moves.push(goRight)
      path += goRight ? 1 : 0
    }
    const finalSlot = Math.min(path, multipliers.length - 1)

    // Animate ball drop
    let animRow = 0
    let ballPegCol = 0  // position in current row

    const animInterval = setInterval(() => {
      if (animRow >= ROWS) {
        clearInterval(animInterval)
        const mult = multipliers[finalSlot]
        const payout = amt * mult
        setResult({ slot: finalSlot, multiplier: mult, payout })
        setHistory(prev => [{ multiplier: mult, won: mult >= 1 }, ...prev.slice(0, 19)])
        setBalance(prev => prev + payout)
        setDropping(false)
        drawBoard(undefined, undefined, finalSlot)
        return
      }

      const pegsInRow = animRow + 3
      const spacing = W / (pegsInRow + 1)
      const py = startY + animRow * rowH
      const bx = spacing * (ballPegCol + 1)

      drawBoard(bx, py)

      if (moves[animRow]) ballPegCol++
      animRow++
    }, 80)
  }

  return (
    <Layout hideSidebar>
      <Head><title>Plinko — BetPro Casino</title></Head>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, marginBottom: 4 }}>📌 PLINKO</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Drop the ball. Watch it bounce. Win up to 10×.</div>

        {/* Result banner */}
        {result && !dropping && (
          <div style={{
            background: result.multiplier >= 1 ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)',
            border: `1px solid ${result.multiplier >= 1 ? 'var(--accent)' : 'var(--live-red)'}`,
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16, textAlign: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
            color: result.multiplier >= 1 ? 'var(--accent)' : 'var(--live-red)',
          }}>
            {result.multiplier}× — {result.multiplier >= 1 ? `🎉 +₹${(result.payout - parseFloat(stake)).toFixed(0)}` : `❌ -₹${(parseFloat(stake) - result.payout).toFixed(0)}`}
          </div>
        )}

        {/* Canvas board */}
        <div style={{ background: '#0c0f14', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 20 }}>
          <canvas ref={canvasRef} width={600} height={420} style={{ width: '100%' }} />
        </div>

        {/* Risk level */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Risk Level</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['low','medium','high'] as Risk[]).map(r => (
              <button key={r} onClick={() => { setRisk(r); setTimeout(drawBoard, 50) }} style={{
                flex: 1, padding: '10px', background: risk === r ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                border: `1px solid ${risk === r ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', color: risk === r ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Stake + Drop */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Stake (₹)</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 13 }}>₹</span>
                <input type="number" value={stake} onChange={e => setStake(e.target.value)} disabled={dropping}
                  style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 'var(--radius)', padding: '10px 10px 10px 26px', color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-mono)' }} />
              </div>
              {[100,500,1000].map(v => (
                <button key={v} onClick={() => setStake(String(v))} disabled={dropping} style={{ padding: '0 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                  ₹{v >= 1000 ? `${v/1000}k` : v}
                </button>
              ))}
            </div>
          </div>
          <button onClick={drop} disabled={dropping || !user} style={{
            padding: '11px 40px', background: dropping ? 'var(--bg-elevated)' : 'var(--accent)',
            color: dropping ? 'var(--text-muted)' : '#000', borderRadius: 'var(--radius)', border: 'none',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: dropping ? 'not-allowed' : 'pointer', minWidth: 140,
          }}>
            {dropping ? 'DROPPING...' : '📌 DROP'}
          </button>
        </div>

        {error && <div style={{ color: 'var(--live-red)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>History</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {history.map((h, i) => (
                <span key={i} style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  background: h.won ? 'rgba(0,212,170,0.1)' : 'rgba(224,63,63,0.1)',
                  color: h.won ? 'var(--accent)' : 'var(--live-red)',
                }}>{h.multiplier}×</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
