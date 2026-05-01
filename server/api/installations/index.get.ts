import { count, eq } from 'drizzle-orm'
import { installations, repositories, userInstallations } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const db = useDb()

  const rows = await db
    .select({
      id: installations.id,
      githubInstallationId: installations.githubInstallationId,
      accountLogin: installations.accountLogin,
      accountType: installations.accountType,
      suspendedAt: installations.suspendedAt,
    })
    .from(installations)
    .innerJoin(
      userInstallations,
      eq(userInstallations.installationId, installations.id),
    )
    .where(eq(userInstallations.userId, session.user.id))

  const countRows = await db
    .select({
      installationId: repositories.installationId,
      c: count(repositories.id).as('c'),
    })
    .from(repositories)
    .groupBy(repositories.installationId)

  const countMap = new Map(
    countRows.map((r) => [r.installationId, Number(r.c)]),
  )

  return rows.map((r) => ({
    ...r,
    repoCount: countMap.get(r.id) ?? 0,
  }))
})
