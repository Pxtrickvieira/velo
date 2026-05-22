import 'dotenv/config'
import * as pg from 'pg'
import { Kysely, PostgresDialect } from 'kysely'

import { Database } from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Defina DATABASE_URL no arquivo .env para os testes E2E.')
}

const dialect = new PostgresDialect({
  pool: new pg.Pool({
    connectionString,
    max: 10,
    ssl: { rejectUnauthorized: false },
  }),
})

export const db = new Kysely<Database>({
  dialect,
})
