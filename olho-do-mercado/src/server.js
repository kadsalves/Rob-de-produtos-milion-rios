import { createApp } from './app.js'
import { openDatabase } from './models/database.js'
import { createUser } from './models/users.js'
import { settings } from './utils/config.js'
import { seedDemoOffers } from './services/OfferMonitor.js'

const config = settings()
const database = await openDatabase(config)
try {
  if (config.demo) {
    await createUser(database, config.demoEmail, config.demoPassword)
    await seedDemoOffers(database)
  }
} catch (error) {
  await database.close()
  throw error
}

const server = createApp(database, config).listen(config.port, config.production ? '0.0.0.0' : '127.0.0.1', () => {
  console.log('API pronta na porta', config.port)
})
for (const name of ['SIGINT', 'SIGTERM']) {
  process.once(name, () => server.close(async () => {
    await database.close()
  }))
}
