import type { Octokit } from '@octokit/rest'

export const REVIEWFORGE_CHECK_NAME = 'ReviewForge AI Review'

/** GitHub Check Run output text max length (see REST API docs). */
const GITHUB_CHECK_OUTPUT_MAX = 65_535

function truncateForGithubOutput(text: string): string {
  if (text.length <= GITHUB_CHECK_OUTPUT_MAX) return text
  const omission = '\n\n…(truncated for GitHub check output limit)'
  return (
    text.slice(0, GITHUB_CHECK_OUTPUT_MAX - omission.length) + omission
  )
}

/**
 * Create a check run already in terminal state (e.g. automation could not run).
 */
export async function createFinishedCheckRun(
  octokit: Octokit,
  params: {
    owner: string
    repo: string
    headSha: string
    conclusion: 'success' | 'failure'
    summary: string
    title?: string
    detailsUrl?: string | null
  },
): Promise<number> {
  const completedAt = new Date().toISOString()
  const summary = truncateForGithubOutput(params.summary || '')
  const { data } = await octokit.rest.checks.create({
    owner: params.owner,
    repo: params.repo,
    name: REVIEWFORGE_CHECK_NAME,
    head_sha: params.headSha,
    status: 'completed',
    conclusion: params.conclusion,
    completed_at: completedAt,
    details_url: params.detailsUrl ?? undefined,
    output: {
      title: params.title ?? REVIEWFORGE_CHECK_NAME,
      summary,
    },
  })
  return Number(data.id)
}

export async function createInProgressCheckRun(
  octokit: Octokit,
  params: {
    owner: string
    repo: string
    headSha: string
    detailsUrl?: string | null
  },
): Promise<number> {
  const startedAt = new Date().toISOString()
  const { data } = await octokit.rest.checks.create({
    owner: params.owner,
    repo: params.repo,
    name: REVIEWFORGE_CHECK_NAME,
    head_sha: params.headSha,
    status: 'in_progress',
    started_at: startedAt,
    details_url: params.detailsUrl ?? undefined,
  })
  return Number(data.id)
}

export async function completeCheckRun(
  octokit: Octokit,
  params: {
    owner: string
    repo: string
    checkRunId: number
    conclusion: 'success' | 'failure'
    summary: string
    title?: string
  },
): Promise<void> {
  const completedAt = new Date().toISOString()
  const summary = truncateForGithubOutput(params.summary || '')
  await octokit.rest.checks.update({
    owner: params.owner,
    repo: params.repo,
    check_run_id: params.checkRunId,
    status: 'completed',
    conclusion: params.conclusion,
    completed_at: completedAt,
    output: {
      title: params.title ?? REVIEWFORGE_CHECK_NAME,
      summary,
    },
  })
}
