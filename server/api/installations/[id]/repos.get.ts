import { asc, eq } from 'drizzle-orm'
import { repositories } from '../../../db/schema'
import { assertUserOwnsInstallation } from '../../../services/github/installations'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const installationId = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(installationId)) {
    throw createError({ statusCode: 400, message: 'Invalid installation id' })
  }

  const db = useDb()
  const ok = await assertUserOwnsInstallation(
    db,
    session.user.id,
    installationId,
  )
  if (!ok) {
    throw createError({ statusCode: 404, message: 'Installation not found' })
  }

  const repos = await db
    .select({
      id: repositories.id,
      owner: repositories.owner,
      name: repositories.name,
      fullName: repositories.fullName,
      private: repositories.private,
      defaultBranch: repositories.defaultBranch,
    })
    .from(repositories)
    .where(eq(repositories.installationId, installationId))
    .orderBy(asc(repositories.fullName))

  return repos
})
