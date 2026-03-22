import 'dotenv/config'
import { Telegraf, session } from 'telegraf'
import { createLogger } from '@sportsbook/logger'
import { registerCommands } from './commands'
import { registerScenes } from './scenes'

const log = createLogger('telegram-bot')
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)

bot.use(session())

registerCommands(bot)
registerScenes(bot)

bot.catch((err, ctx) => {
  log.error({ err, userId: ctx.from?.id }, 'Bot error')
  ctx.reply('Something went wrong. Please try again.')
})

bot.launch({ dropPendingUpdates: true })
log.info('Telegram bot started')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
