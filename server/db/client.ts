import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'

let pool: pg.Pool | null = null

export function getPool(connectionString: string) {
  if (!pool) {
    pool = new pg.Pool({ connectionString })
  }
  return pool
}

export function getDb(connectionString: string) {
  return drizzle(getPool(connectionString), { schema })
}

export type Database = ReturnType<typeof getDb>
