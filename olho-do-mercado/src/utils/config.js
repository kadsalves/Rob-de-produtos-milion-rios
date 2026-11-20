import { randomBytes } from 'node:crypto'

export function settings(env = process.env) {
  const production = env.NODE_ENV === 'production'
  const port = Number(env.PORT || 3001)
  const demo = !production && env.DEMO_MODE !== 'false'
  const jwtSecret = env.JWT_SECRET || (production ? '' : randomBytes(32).toString('hex'))
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET requer 32 caracteres ou mais.')
  if (production && !env.DATABASE_URL) throw new Error('Informe DATABASE_URL em produção.')
  const publicUrl = new URL(env.PUBLIC_URL || (production ? 'https://localhost' : 'http://localhost:5173'))
  if (production && (publicUrl.protocol !== 'https:' || publicUrl.hostname === 'localhost')) {
    throw new Error('Em produção, PUBLIC_URL deve apontar para o domínio público HTTPS.')
  }
  return {
    production, port, demo, jwtSecret, publicUrl,
    trustProxy: Number(env.TRUST_PROXY_HOPS || 0),
    origins: new Set([publicUrl.origin, ...(!production ? ['http://127.0.0.1:5173', 'http://localhost:5173'] : [])]),
    databaseUrl: env.DATABASE_URL,
    localDbPath: env.LOCAL_DB_PATH || '.local-db',
    demoEmail: env.DEMO_EMAIL || 'demo@olhodomercado.local',
    demoPassword: env.DEMO_PASSWORD || 'OlhoDemo2026!',
    copyUrl: env.COPY_API_BASE_URL || 'https://api.openai.com/v1',
    copyKey: env.OPENAI_API_KEY || '',
    explicitCopyUrl: Boolean(env.COPY_API_BASE_URL),
    copyModel: env.COPY_MODEL || 'gpt-4.1-mini'
  }
}
