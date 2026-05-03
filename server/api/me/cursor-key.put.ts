import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import {
  assertEncryptionKey,
  encryptSecret,
} from '../../services/crypto/secretBox'

const MIN_KEY_LEN = 20
const MAX_KEY_LEN = 512

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'PUT') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const session = await requireUserSession(event)
  const body = await readBody<{ apiKey?: unknown }>(event)
  const apiKey =
    typeof body.apiKey === 'string' ? body.apiKey.trim() : ''

  if (apiKey.length < MIN_KEY_LEN || apiKey.length > MAX_KEY_LEN) {
    throw createError({
      statusCode: 400,
      message: `API key must be between ${MIN_KEY_LEN} and ${MAX_KEY_LEN} characters`,
    })
  }

  const config = useRuntimeConfig()
  const master = String(config.encryptionKey || '')
  try {
    assertEncryptionKey(master)
  } catch {
    throw createError({
      statusCode: 500,
      message:
        'NUXT_ENCRYPTION_KEY must be set to at least 32 characters on the server',
    })
  }

  const enc = encryptSecret(apiKey, master)
  const db = useDb()
  await db
    .update(users)
    .set({
      cursorApiKeyEncrypted: enc,
      cursorApiKeyUpdatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))

  return { ok: true as const }
})
