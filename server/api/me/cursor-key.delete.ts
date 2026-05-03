import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'DELETE') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const session = await requireUserSession(event)
  const db = useDb()
  await db
    .update(users)
    .set({
      cursorApiKeyEncrypted: null,
      cursorApiKeyUpdatedAt: null,
    })
    .where(eq(users.id, session.user.id))

  return { ok: true as const }
})
