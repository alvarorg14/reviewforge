import { and, desc, eq } from 'drizzle-orm'
import { aiReviewRuns } from '../../../../../../../db/schema'
import { getRepositoryForUser } from '../../../../../../../services/github/repos'

export default defineEventHandler(async (event) => {
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

  const [latest] = await db
    .select({
      id: aiReviewRuns.id,
      status: aiReviewRuns.status,
      summary: aiReviewRuns.summary,
      error: aiReviewRuns.error,
      createdAt: aiReviewRuns.createdAt,
      finishedAt: aiReviewRuns.finishedAt,
      cursorAgentId: aiReviewRuns.cursorAgentId,
    })
    .from(aiReviewRuns)
    .where(
      and(
        eq(aiReviewRuns.repositoryId, row.repo.id),
        eq(aiReviewRuns.prNumber, prNumber),
      ),
    )
    .orderBy(desc(aiReviewRuns.createdAt))
    .limit(1)

  return latest ?? null
})
