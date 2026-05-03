import { AI_CONTEXT_MAX_LENGTH } from '../../../../../../shared/aiRepoSettings'
import { eq } from 'drizzle-orm'
import { repositories } from '../../../../../db/schema'
import { isReviewStyle } from '../../../../../services/ai/types'
import { getRepositoryForUser } from '../../../../../services/github/repos'

type PatchBody = {
  aiContext?: string | null
  aiAllowApprove?: boolean
  aiReviewStyle?: string
}

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'PATCH') {
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

  const body = (await readBody(event).catch(() => null)) as PatchBody | null
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Expected JSON body' })
  }

  const patch: Partial<{
    aiContext: string | null
    aiAllowApprove: boolean
    aiReviewStyle: string
  }> = {}

  if ('aiContext' in body) {
    if (body.aiContext != null && typeof body.aiContext !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'aiContext must be a string or null',
      })
    }
    const raw = body.aiContext == null ? null : body.aiContext
    if (raw != null && raw.length > AI_CONTEXT_MAX_LENGTH) {
      throw createError({
        statusCode: 400,
        message: `aiContext exceeds maximum length (${AI_CONTEXT_MAX_LENGTH} characters)`,
      })
    }
    patch.aiContext = raw
  }

  if ('aiAllowApprove' in body) {
    if (typeof body.aiAllowApprove !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'aiAllowApprove must be a boolean',
      })
    }
    patch.aiAllowApprove = body.aiAllowApprove
  }

  if ('aiReviewStyle' in body) {
    if (typeof body.aiReviewStyle !== 'string' || !isReviewStyle(body.aiReviewStyle)) {
      throw createError({
        statusCode: 400,
        message: 'aiReviewStyle must be one of: concise, thorough, security',
      })
    }
    patch.aiReviewStyle = body.aiReviewStyle
  }

  if (Object.keys(patch).length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No valid fields to update',
    })
  }

  await db
    .update(repositories)
    .set(patch)
    .where(eq(repositories.id, row.repo.id))

  const [updated] = await db
    .select({
      aiContext: repositories.aiContext,
      aiAllowApprove: repositories.aiAllowApprove,
      aiReviewStyle: repositories.aiReviewStyle,
    })
    .from(repositories)
    .where(eq(repositories.id, row.repo.id))
    .limit(1)

  if (!updated) {
    throw createError({ statusCode: 500, message: 'Failed to read updated row' })
  }

  return {
    aiContext: updated.aiContext ?? null,
    aiAllowApprove: updated.aiAllowApprove,
    aiReviewStyle: updated.aiReviewStyle,
  }
})
