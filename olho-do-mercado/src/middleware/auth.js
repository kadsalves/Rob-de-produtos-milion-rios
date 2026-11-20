import jwt from 'jsonwebtoken'
import { HttpError } from './errors.js'

const name = 'olho_session'
const jwtOptions = { algorithm: 'HS256', issuer: 'olho-do-mercado', audience: 'dashboard' }

export function session(database, config) {
  const cookie = { httpOnly: true, sameSite: 'lax', secure: config.production, path: '/api' }
  return {
    start(res, id) {
      const token = jwt.sign({}, config.jwtSecret, { ...jwtOptions, subject: id, expiresIn: '8h' })
      res.cookie(name, token, { ...cookie, maxAge: 8 * 60 * 60 * 1000 })
    },
    end(res) {
      res.clearCookie(name, cookie)
    },
    async require(req, res, next) {
      const token = req.headers.cookie?.split(';').map(value => value.trim())
        .find(value => value.startsWith(name + '='))?.slice(name.length + 1)
      let claims
      try {
        claims = jwt.verify(token, config.jwtSecret, {
          algorithms: [jwtOptions.algorithm], issuer: jwtOptions.issuer, audience: jwtOptions.audience
        })
      } catch {
        throw new HttpError(401, 'Entre na sua conta para continuar.')
      }
      const { rows: [user] } = await database.query(
        'SELECT id, email, plan FROM users WHERE id = $1 AND active', [claims.sub])
      if (!user) throw new HttpError(401, 'Sua sessão não está disponível.')
      req.user = user
      next()
    }
  }
}
