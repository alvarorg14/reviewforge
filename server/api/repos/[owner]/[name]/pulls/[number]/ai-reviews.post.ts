import { and, eq, inArray } from 'drizzle-orm'
import { aiReviewRuns } from '../../../../../../db/schema'
import { startAIReviewRunInBackground } from '../../../../../../services/ai/runner'
import { createInstallationOctokit } from '../../../../../../services/github/client'
import { getRepositoryForUser } from '../../../../../../services/github/repos'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const session = await requireUserSession(event)
  const owner = getRouterParam(event, 'owner')!
  const name = getRouterParam(event, 'name')!
  const numberStr = getRouterParam(event, 'number')!
  const prNumber = Number.parseInt(numberStr, 10)
  if (!Number.isFinite(prNumber) || prNumber < 1) {
    throw createError({
      statusCode: 400,
      message: 'Invalid pull request number',
    })
  }

  const db = useDb()
  const row = await getRepositoryForUser(db, session.user.id, owner, name)
  if (!row) {
    throw createError({ statusCode: 404, message: 'Repository not found' })
  }

  const existing = await db
    .select({ id: aiReviewRuns.id })
    .from(aiReviewRuns)
    .where(
      and(
        eq(aiReviewRuns.repositoryId, row.repo.id),
        eq(aiReviewRuns.prNumber, prNumber),
        inArray(aiReviewRuns.status, ['pending', 'running']),
      ),
    )
    .limit(1)

  if (existing[0]) {
    throw createError({
      statusCode: 409,
      message: 'An AI review is already in progress for this pull request',
      data: { runId: existing[0].id },
    })
  }

  const octokit = createInstallationOctokit(
    row.installation.githubInstallationId,
  )
  let prHtmlUrl: string
  try {
    const { data: pr } = await octokit.rest.pulls.get({
      owner,
      repo: name,
      pull_number: prNumber,
    })
    prHtmlUrl = pr.html_url
  } catch {
    throw createError({ statusCode: 404, message: 'Pull request not found' })
  }

  const [inserted] = await db
    .insert(aiReviewRuns)
    .values({
      repositoryId: row.repo.id,
      prNumber,
      requestedByUserId: session.user.id,
      status: 'pending',
    })
    .returning({ id: aiReviewRuns.id })

  if (!inserted) {
    throw createError({ statusCode: 500, message: 'Failed to start AI review' })
  }

  startAIReviewRunInBackground({
    db,
    runId: inserted.id,
    installationGithubId: row.installation.githubInstallationId,
    owner,
    repo: name,
    pullNumber: prNumber,
    prHtmlUrl,
  })

  return { runId: inserted.id }
})
