import { FastifyInstance } from 'fastify'
import { AuthController } from '../controllers/auth'
import { authenticate } from '@sportsbook/auth-middleware'

export default async function authRoutes(app: FastifyInstance) {
  const ctrl = new AuthController()

  app.post('/register', ctrl.register.bind(ctrl))
  app.post('/login', ctrl.login.bind(ctrl))
  app.post('/refresh', ctrl.refreshToken.bind(ctrl))
  app.post('/logout', { preHandler: [authenticate] }, ctrl.logout.bind(ctrl))
  app.post('/send-otp', ctrl.sendOtp.bind(ctrl))
  app.post('/verify-otp', ctrl.verifyOtp.bind(ctrl))
  app.get('/me', { preHandler: [authenticate] }, ctrl.me.bind(ctrl))
}
