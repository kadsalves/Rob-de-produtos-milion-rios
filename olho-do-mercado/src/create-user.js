import { openDatabase } from './models/database.js'
import { createUser } from './models/users.js'
import { settings } from './utils/config.js'

const { USER_EMAIL, USER_PASSWORD } = process.env
if (!USER_EMAIL || !USER_PASSWORD) throw new Error('Defina USER_EMAIL e USER_PASSWORD no ambiente.')
const database = await openDatabase(settings())
try {
  if (!(await createUser(database, USER_EMAIL, USER_PASSWORD))) throw new Error('Já existe uma conta com este e-mail.')
  console.log('Conta criada.')
} finally {
  await database.close()
}
