import { FastifyInstance } from 'fastify'
import { ProfileController } from '../controllers/profile'
import { authenticate } from '@sportsbook/auth-middleware'

export default async function profileRoutes(app: FastifyInstance) {
  const ctrl = new ProfileController()
  app.addHook('preHandler', authenticate)
  app.get('/', ctrl.getProfile.bind(ctrl))
  app.patch('/', ctrl.updateProfile.bind(ctrl))
  app.post('/kyc', ctrl.submitKyc.bind(ctrl))
  app.get('/kyc/status', ctrl.kycStatus.bind(ctrl))
}
