import { Telegraf } from 'telegraf'

export function registerScenes(bot: Telegraf) {
  // Login scene — collect email + password
  bot.command('login', async (ctx) => {
    await ctx.reply('Please send your email to log in:')
    ;(ctx as any).session.loginStep = 'email'
  })

  bot.on('text', async (ctx) => {
    const session = (ctx as any).session
    if (session?.loginStep === 'email') {
      session.loginEmail = ctx.message.text
      session.loginStep = 'password'
      await ctx.reply('Now send your password:')
    } else if (session?.loginStep === 'password') {
      session.loginStep = null
      try {
        const axios = (await import('axios')).default
        const API = process.env.GATEWAY_URL ?? 'http://localhost:4000'
        const { data } = await axios.post(`${API}/api/auth/login`, {
          email: session.loginEmail,
          password: ctx.message.text,
        })
        session.token = data.data.accessToken
        await ctx.reply('✅ Logged in! Use /balance to check your wallet.')
      } catch {
        await ctx.reply('❌ Login failed. Check your credentials and try again.')
      }
      delete session.loginEmail
    }
  })
}
