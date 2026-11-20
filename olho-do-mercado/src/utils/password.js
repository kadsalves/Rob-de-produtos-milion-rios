import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const derive = promisify(scrypt)

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await derive(password, salt, 64)
  return salt + ':' + key.toString('hex')
}

export async function verifyPassword(password, encoded) {
  const [salt, stored] = encoded.split(':')
  const expected = Buffer.from(stored, 'hex')
  const actual = await derive(password, salt, expected.length)
  return timingSafeEqual(actual, expected)
}
