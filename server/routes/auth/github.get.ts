import { users } from '../../db/schema'

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
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
    })

    return sendRedirect(event, '/dashboard')
  },
  onError(event, error) {
    console.error('[auth/github]', error)
    return sendRedirect(event, '/?error=oauth')
  },
})
