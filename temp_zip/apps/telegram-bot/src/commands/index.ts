import { Telegraf } from 'telegraf'
import axios from 'axios'

const API = process.env.GATEWAY_URL ?? 'http://localhost:4000'

export function registerCommands(bot: Telegraf) {
  bot.command('start', async (ctx) => {
    await ctx.reply(
      'Welcome to Sportsbook! 🏏\n\n' +
      'Commands:\n' +
      '/balance - Check wallet balance\n' +
      '/live    - Live matches\n' +
      '/history - Your bet history\n' +
      '/deposit - Deposit funds\n' +
      '/crash   - Crash game\n' +
      '/help    - Help'
    )
  })

  bot.command('balance', async (ctx) => {
    const token = (ctx as any).session?.token as string | undefined
    if (!token) { await ctx.reply('Please /login first'); return }
    try {
      const { data } = await axios.get(`${API}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const b = data.data
      await ctx.reply(
        `Wallet Balance\n\n` +
        `Available: ₹${(b.available as number).toLocaleString()}\n` +
        `Locked:    ₹${(b.locked as number).toLocaleString()}\n` +
        `Bonus:     ₹${(b.bonus as number).toLocaleString()}`
      )
    } catch { await ctx.reply('Could not fetch balance. Try again.') }
  })

  bot.command('live', async (ctx) => {
    try {
      const { data } = await axios.get(`${API}/api/fixtures/live`)
      const fixtures = data.data as any[]
      if (!fixtures?.length) { await ctx.reply('No live matches right now.'); return }
      const msg = fixtures.slice(0, 5).map((f: any) =>
        `${f.homeTeam?.name} vs ${f.awayTeam?.name}\n${f.sport?.name ?? ''}`
      ).join('\n\n')
      await ctx.reply(`Live Matches:\n\n${msg}`)
    } catch { await ctx.reply('Could not fetch live matches.') }
  })

  bot.command('history', async (ctx) => {
    const token = (ctx as any).session?.token as string | undefined
    if (!token) { await ctx.reply('Please /login first'); return }
    try {
      const { data } = await axios.get(`${API}/api/history?limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const slips = data.data as any[]
      if (!slips?.length) { await ctx.reply('No bet history yet.'); return }
      const msg = slips.map((s: any) =>
        `Bet #${(s.id as string).slice(0, 8)}\nStake: ₹${s.totalStake} | ${s.status}`
      ).join('\n\n')
      await ctx.reply(`Recent Bets:\n\n${msg}`)
    } catch { await ctx.reply('Could not fetch history.') }
  })

  bot.command('deposit', async (ctx) => {
    await ctx.reply('To deposit, visit our website → Wallet → Deposit', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Open Website', url: 'https://sportsbook.example.com/wallet' }]],
      },
    })
  })

  bot.command('crash', async (ctx) => {
    await ctx.reply('Crash Game — multiplier climbs until it crashes. Cash out before it does!', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Play Crash', url: 'https://sportsbook.example.com/casino/crash' }]],
      },
    })
  })

  bot.command('help', async (ctx) => {
    await ctx.reply('Support: support@sportsbook.example.com')
  })
}
