import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import pg from 'pg'

export async function openDatabase(config) {
  const pool = config.databaseUrl && new pg.Pool({ connectionString: config.databaseUrl })
  const local = pool ? null : new PGlite(config.localDbPath)
  const database = {
    query: (sql, values = []) => (pool ?? local).query(sql, values),
    async transaction(work) {
      if (local) return local.transaction(work)
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const result = await work(client)
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    },
    close: () => pool ? pool.end() : local.close()
  }
  try {
    const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8')
    if (pool) await pool.query(schema)
    else await local.exec(schema)
    return database
  } catch (error) {
    await database.close()
    throw error
  }
}
