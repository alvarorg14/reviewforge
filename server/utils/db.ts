import type { Database } from '../db/client'
import { getDb } from '../db/client'

let _db: Database | null = null

export function useDb(): Database {
  const config = useRuntimeConfig()
  const url = config.databaseUrl
  if (!url) {
    throw createError({
      statusCode: 500,
      message: 'DATABASE_URL / runtimeConfig.databaseUrl is not configured',
    })
  }
  if (!_db) {
    _db = getDb(url)
  }
  return _db
}
