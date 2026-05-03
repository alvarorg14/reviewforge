import { createInstallationOctokit } from '../../../services/github/client'
import {
  linkUserToInstallation,
  upsertInstallationFromGithub,
} from '../../../services/github/installations'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const installationGithubId = Number(getQuery(event).installation_id)
  if (!Number.isFinite(installationGithubId)) {
    throw createError({
      statusCode: 400,
      message: 'installation_id is required',
    })
  }

  const octokit = createInstallationOctokit(installationGithubId)
  const { data } = await octokit.rest.apps.getInstallation({
    installation_id: installationGithubId,
  })

  const account = data.account
  if (!account || !('login' in account)) {
    throw createError({ statusCode: 502, message: 'Invalid installation account' })
  }

  const db = useDb()
  const row = await upsertInstallationFromGithub(db, {
    githubInstallationId: data.id,
    accountLogin: account.login,
    accountType: account.type ?? 'User',
    accountId: account.id,
    suspendedAt: data.suspended_at ? new Date(data.suspended_at) : null,
  })

  if (!row) {
    throw createError({ statusCode: 500, message: 'Failed to save installation' })
  }

  await linkUserToInstallation(db, session.user.id, row.id)

  return sendRedirect(event, `/dashboard/installations/${row.id}/select`)
})
