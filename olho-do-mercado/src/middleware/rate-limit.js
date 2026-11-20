import { rateLimit } from 'express-rate-limit'

export const apiLimit = () => rateLimit({
  windowMs: 60_000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Muitas solicitações. Tente novamente em instantes.' }
})

export const loginLimit = () => rateLimit({
  windowMs: 15 * 60_000, limit: 15, skipSuccessfulRequests: true,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' }
})
