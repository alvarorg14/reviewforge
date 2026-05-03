import { assertEncryptionKey } from '../../services/crypto/secretBox'
import { getCursorApiKeyMetadataForUser } from '../../services/ai/userApiKey'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const session = await requireUserSession(event)
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

  const db = useDb()
  try {
    return await getCursorApiKeyMetadataForUser(
      db,
      session.user.id,
      master,
    )
  } catch {
    throw createError({
      statusCode: 500,
      message:
        'Could not read stored Cursor API key. Try saving it again in Settings.',
    })
  }
})
