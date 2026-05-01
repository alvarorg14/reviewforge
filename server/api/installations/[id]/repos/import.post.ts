import { and, eq, notInArray } from 'drizzle-orm'
import { installations, repositories } from '../../../../db/schema'
import {
  assertUserOwnsInstallation,
  fetchReposAccessibleToInstallation,
  upsertRepositories,
} from '../../../../services/github/installations'

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

  const body = await readBody<{ githubRepoIds?: unknown }>(event)
  const idsRaw = body?.githubRepoIds
  if (!Array.isArray(idsRaw)) {
    throw createError({
      statusCode: 400,
      message: 'githubRepoIds must be an array',
    })
  }

  const requested = new Set<number>()
  for (const x of idsRaw) {
    const n = Number(x)
    if (!Number.isFinite(n)) {
      throw createError({
        statusCode: 400,
        message: 'Each githubRepoIds entry must be a number',
      })
    }
    requested.add(n)
  }

  const [inst] = await db
    .select({ githubInstallationId: installations.githubInstallationId })
    .from(installations)
    .where(eq(installations.id, installationId))
    .limit(1)

  if (!inst) {
    throw createError({ statusCode: 404, message: 'Installation not found' })
  }

  const accessible = await fetchReposAccessibleToInstallation(
    inst.githubInstallationId,
  )
  const toImport = accessible.filter((r) => requested.has(r.id))
  const normalizedIds = new Set(toImport.map((r) => r.id))

  await upsertRepositories(db, installationId, toImport)

  if (normalizedIds.size === 0) {
    await db
      .delete(repositories)
      .where(eq(repositories.installationId, installationId))
  } else {
    await db
      .delete(repositories)
      .where(
        and(
          eq(repositories.installationId, installationId),
          notInArray(repositories.githubRepoId, [...normalizedIds]),
        ),
      )
  }

  return { imported: toImport.length }
})
