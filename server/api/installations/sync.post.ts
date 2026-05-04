import { syncUserInstallations } from '../../services/github/installations'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const token = session.secure?.githubAccessToken
  if (!token) {
    throw createError({
      statusCode: 401,
      message:
        'GitHub access token missing; please sign out and sign in with GitHub again to sync installations.',
    })
  }

  const db = useDb()
  const installationIds = await syncUserInstallations(
    db,
    session.user.id,
    token,
  )

  return {
    linked: installationIds.length,
    installationIds,
  }
})
