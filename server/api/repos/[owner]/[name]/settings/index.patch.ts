import { AI_CONTEXT_MAX_LENGTH } from '../../../../../../shared/aiRepoSettings'
import { and, eq, isNotNull } from 'drizzle-orm'
import { repositories, userInstallations, users } from '../../../../../db/schema'
import { isReviewStyle } from '../../../../../services/ai/types'
import { getRepositoryForUser } from '../../../../../services/github/repos'

type PatchBody = {
  aiContext?: string | null
  aiAllowApprove?: boolean
  aiReviewStyle?: string
  autoReviewEnabled?: boolean
  autoReviewUserId?: number | null
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
    autoReviewEnabled: boolean
    autoReviewUserId: number | null
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

  if ('autoReviewEnabled' in body) {
    if (typeof body.autoReviewEnabled !== 'boolean') {
      throw createError({
        statusCode: 400,
        message: 'autoReviewEnabled must be a boolean',
      })
    }
    patch.autoReviewEnabled = body.autoReviewEnabled
  }

  if ('autoReviewUserId' in body) {
    const v = body.autoReviewUserId
    if (v != null && (typeof v !== 'number' || !Number.isInteger(v) || v < 1)) {
      throw createError({
        statusCode: 400,
        message: 'autoReviewUserId must be a positive integer or null',
      })
    }
    if (v != null) {
      const [allowed] = await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(userInstallations, eq(userInstallations.userId, users.id))
        .where(
          and(
            eq(users.id, v),
            eq(userInstallations.installationId, row.installation.id),
            isNotNull(users.cursorApiKeyEncrypted),
          ),
        )
        .limit(1)
      if (!allowed) {
        throw createError({
          statusCode: 400,
          message:
            'autoReviewUserId must be a linked installation member with a Cursor API key stored in ReviewForge, or null',
        })
      }
    }
    patch.autoReviewUserId = v
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
      autoReviewEnabled: repositories.autoReviewEnabled,
      autoReviewUserId: repositories.autoReviewUserId,
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
    autoReviewEnabled: updated.autoReviewEnabled,
    autoReviewUserId: updated.autoReviewUserId ?? null,
  }
})
