import type { Octokit } from '@octokit/rest'

export type PullListState = 'open' | 'closed' | 'all'

export async function listPullRequestsForRepo(
  octokit: Octokit,
  params: { owner: string; repo: string; state: PullListState },
) {
  const pulls = await octokit.paginate(octokit.rest.pulls.list, {
    owner: params.owner,
    repo: params.repo,
    state: params.state,
    per_page: 100,
    sort: 'updated',
    direction: 'desc',
  })
  return pulls.map((p) => {
    const ext = p as typeof p & {
      mergeable_state?: string | null
    }
    return {
      number: p.number,
      title: p.title,
      state: p.state,
      draft: p.draft ?? false,
      htmlUrl: p.html_url,
      author: p.user
        ? { login: p.user.login, avatarUrl: p.user.avatar_url }
        : null,
      updatedAt: p.updated_at,
      mergeableState: ext.mergeable_state ?? null,
      labels: [] as { name: string; color?: string }[],
    }
  })
}
