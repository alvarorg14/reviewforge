import { eq } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { users } from '../../db/schema'
import { decryptSecret } from '../crypto/secretBox'

/** True if the user has a non-null encrypted Cursor API key blob. */
export async function userHasStoredCursorApiKey(
  db: Database,
  userId: number,
): Promise<boolean> {
  const [row] = await db
    .select({ enc: users.cursorApiKeyEncrypted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  return Boolean(row?.enc)
}

export async function getCursorApiKeyForUser(
  db: Database,
  userId: number,
  masterSecret: string,
): Promise<string | null> {
  const [row] = await db
    .select({ enc: users.cursorApiKeyEncrypted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!row?.enc) return null
  return decryptSecret(row.enc, masterSecret)
}

export type CursorKeyMetadata = {
  hasKey: boolean
  updatedAt: string | null
  maskedSuffix: string | null
}

export async function getCursorApiKeyMetadataForUser(
  db: Database,
  userId: number,
  masterSecret: string,
): Promise<CursorKeyMetadata> {
  const [row] = await db
    .select({
      enc: users.cursorApiKeyEncrypted,
      updatedAt: users.cursorApiKeyUpdatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!row?.enc) {
    return { hasKey: false, updatedAt: null, maskedSuffix: null }
  }

  const plain = decryptSecret(row.enc, masterSecret)
  const suffix =
    plain.length <= 4 ? plain : plain.slice(-4)

  return {
    hasKey: true,
    updatedAt: row.updatedAt?.toISOString() ?? null,
    maskedSuffix: suffix,
  }
}
