import { createInstallationOctokit } from '../../../../services/github/client'
import { getRepositoryForUser } from '../../../../services/github/repos'
import {
  listPullRequestsForRepo,
  type PullListState,
} from '../../../../services/github/pulls'

export default defineCachedEventHandler(
  async (event) => {
    const session = await requireUserSession(event)
    const owner = getRouterParam(event, 'owner')!
    const name = getRouterParam(event, 'name')!
    const q = getQuery(event)
    const state = (String(q.state || 'open') as PullListState) || 'open'
    if (!['open', 'closed', 'all'].includes(state)) {
      throw createError({ statusCode: 400, message: 'Invalid state' })
    }

    const db = useDb()
    const row = await getRepositoryForUser(db, session.user.id, owner, name)
    if (!row) {
      throw createError({ statusCode: 404, message: 'Repository not found' })
    }

    const octokit = createInstallationOctokit(
      row.installation.githubInstallationId,
    )
    const pulls = await listPullRequestsForRepo(octokit, {
      owner,
      repo: name,
      state,
    })

    return { pulls }
  },
  {
    maxAge: 45,
    swr: true,
    getKey: async (event) => {
      const session = await getUserSession(event)
      const owner = getRouterParam(event, 'owner') ?? ''
      const name = getRouterParam(event, 'name') ?? ''
      const q = getQuery(event)
      const state = String(q.state || 'open')
      const uid = session.user?.id ?? 'anon'
      return `pulls:${uid}:${owner}:${name}:${state}`
    },
  },
)
