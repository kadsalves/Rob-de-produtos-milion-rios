import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { routes } from './api/routes.js'
import { errors, HttpError } from './middleware/errors.js'
import { apiLimit } from './middleware/rate-limit.js'

export function createApp(database, config) {
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', config.trustProxy)
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      imgSrc: ["'self'", 'data:', 'https:'],
      upgradeInsecureRequests: config.production ? [] : null
    } },
    strictTransportSecurity: config.production
  }))
  app.use('/api', cors({
    origin: (origin, callback) => callback(null, origin && config.origins.has(origin) ? origin : false),
    credentials: true
  }), apiLimit(), express.json({ limit: '16kb' }), (req, res, next) => {
    const origin = req.get('origin')
    if (req.method === 'POST' && (origin ? !config.origins.has(origin) : req.get('sec-fetch-site') === 'cross-site')) {
      throw new HttpError(403, 'Origem não autorizada.')
    }
    res.set('Cache-Control', 'no-store')
    next()
  }, routes(database, config))
  app.use('/api', (req, res) => res.status(404).json({ error: 'Rota não encontrada.' }))

  const dist = fileURLToPath(new URL('../dist/', import.meta.url))
  if (existsSync(dist)) {
    app.use(express.static(dist))
    app.get(['/', '/dashboard', '/login', '/analytics'], (req, res) => res.sendFile('index.html', { root: dist }))
  }
  app.use(errors)
  return app
}
