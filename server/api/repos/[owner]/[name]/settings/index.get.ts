import { and, asc, eq, isNotNull } from 'drizzle-orm'
import { userInstallations, users } from '../../../../../db/schema'
import { getRepositoryForUser } from '../../../../../services/github/repos'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const session = await requireUserSession(event)
  const owner = getRouterParam(event, 'owner')!
  const name = getRouterParam(event, 'name')!

  const db = useDb()
  const row = await getRepositoryForUser(db, session.user.id, owner, name)
  if (!row) {
    throw createError({ statusCode: 404, message: 'Repository not found' })
  }

  const candidates = await db
    .select({
      id: users.id,
      login: users.login,
      name: users.name,
    })
    .from(users)
    .innerJoin(userInstallations, eq(userInstallations.userId, users.id))
    .where(
      and(
        eq(userInstallations.installationId, row.installation.id),
        isNotNull(users.cursorApiKeyEncrypted),
      ),
    )
    .orderBy(asc(users.login))

  const r = row.repo
  return {
    aiContext: r.aiContext ?? null,
    aiAllowApprove: r.aiAllowApprove,
    aiReviewStyle: r.aiReviewStyle,
    autoReviewEnabled: r.autoReviewEnabled,
    autoReviewUserId: r.autoReviewUserId ?? null,
    installationDefaultAutoReviewUserId:
      row.installation.defaultAutoReviewUserId ?? null,
    candidates,
  }
})
