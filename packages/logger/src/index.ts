import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  base: { service: process.env.SERVICE_NAME ?? 'sportsbook' },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
})

export const createLogger = (context: string) => logger.child({ context })
export default logger
