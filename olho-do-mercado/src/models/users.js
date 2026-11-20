import { randomUUID } from 'node:crypto'
import { hashPassword } from '../utils/password.js'

export async function createUser(database, email, password) {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || normalized.length > 254) {
    throw new Error('Informe um endereço de e-mail válido.')
  }
  if (password.length < 10 || password.length > 128) throw new Error('A senha deve ter de 10 a 128 caracteres.')
  const result = await database.query(
    `INSERT INTO users (id,email,password_hash) VALUES ($1,$2,$3)
     ON CONFLICT (email) DO NOTHING RETURNING id`, [randomUUID(), normalized, await hashPassword(password)])
  return Boolean(result.rows.length)
}
