import { eq } from 'drizzle-orm'
import { installations, repositories } from '../../../db/schema'
import {
  assertUserOwnsInstallation,
  fetchReposAccessibleToInstallation,
} from '../../../services/github/installations'

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

  const [inst] = await db
    .select({
      githubInstallationId: installations.githubInstallationId,
      accountLogin: installations.accountLogin,
      accountType: installations.accountType,
    })
    .from(installations)
    .where(eq(installations.id, installationId))
    .limit(1)

  if (!inst) {
    throw createError({ statusCode: 404, message: 'Installation not found' })
  }

  const importedRows = await db
    .select({ githubRepoId: repositories.githubRepoId })
    .from(repositories)
    .where(eq(repositories.installationId, installationId))

  const importedSet = new Set(importedRows.map((r) => Number(r.githubRepoId)))

  const ghRepos = await fetchReposAccessibleToInstallation(
    inst.githubInstallationId,
  )

  const repos = ghRepos.map((r) => ({
    githubRepoId: r.id,
    owner: r.owner.login,
    name: r.name,
    fullName: r.full_name,
    private: r.private,
    defaultBranch: r.default_branch ?? null,
    imported: importedSet.has(r.id),
  }))

  return {
    accountLogin: inst.accountLogin,
    accountType: inst.accountType,
    repositories: repos,
  }
})
