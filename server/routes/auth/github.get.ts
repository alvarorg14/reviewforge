import { users } from '../../db/schema'
import { syncUserInstallations } from '../../services/github/installations'

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user, tokens }) {
    const db = useDb()
    const githubId = Number(user.id)
    const [row] = await db
      .insert(users)
      .values({
        githubId,
        login: user.login,
        name: user.name ?? null,
        avatarUrl: user.avatar_url ?? null,
        email: user.email ?? null,
      })
      .onConflictDoUpdate({
        target: users.githubId,
        set: {
          login: user.login,
          name: user.name ?? null,
          avatarUrl: user.avatar_url ?? null,
          email: user.email ?? null,
        },
      })
      .returning()

    if (!row) {
      throw createError({
        statusCode: 500,
        message: 'Failed to persist user',
      })
    }

    await setUserSession(event, {
      user: {
        id: row.id,
        login: row.login,
        name: row.name,
        avatarUrl: row.avatarUrl,
      },
      loggedInAt: new Date(),
      secure: {
        githubAccessToken: tokens.access_token,
      },
    })

    try {
      await syncUserInstallations(db, row.id, tokens.access_token)
    } catch (err) {
      console.error('[auth/github] syncUserInstallations failed', err)
    }

    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('[auth/github]', error)
    return sendRedirect(event, '/?error=oauth')
  },
})
