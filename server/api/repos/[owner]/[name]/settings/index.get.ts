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

  const r = row.repo
  return {
    aiContext: r.aiContext ?? null,
    aiAllowApprove: r.aiAllowApprove,
    aiReviewStyle: r.aiReviewStyle,
  }
})
