import { eq } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { aiReviewRuns } from '../../db/schema'
import { completeCheckRun } from '../github/checks'
import {
  createInstallationOctokit,
  getInstallationAccessToken,
} from '../github/client'
import { cursorReviewer } from './cursor'
import type { ReviewStyle } from './types'
import { getCursorApiKeyForUser } from './userApiKey'

export type StartAIReviewParams = {
  db: Database
  runId: number
  /** Cursor API key owner (billing); may differ from the user who clicked “Review” for manual runs. */
  requestedByUserId: number
  installationGithubId: number
  owner: string
  repo: string
  pullNumber: number
  prHtmlUrl: string
  repoContext?: string | null
  allowApprove: boolean
  reviewStyle: ReviewStyle
  /** When set, the run updates this GitHub check on completion. */
  checkRunId?: number | null
}

async function finalizeGithubCheck(params: {
  installationGithubId: number
  owner: string
  repo: string
  checkRunId: number | null | undefined
  conclusion: 'success' | 'failure'
  summary: string
}): Promise<void> {
  if (!params.checkRunId) return
  try {
    const octokit = createInstallationOctokit(params.installationGithubId)
    await completeCheckRun(octokit, {
      owner: params.owner,
      repo: params.repo,
      checkRunId: params.checkRunId,
      conclusion: params.conclusion,
      summary: params.summary,
    })
  } catch (e) {
    console.error('[ai-review] finalize GitHub check failed', e)
  }
}

/** Fire-and-forget: updates ai_review_runs as the Cursor run progresses. */
export function startAIReviewRunInBackground(params: StartAIReviewParams): void {
  void processAIReviewRun(params).catch((err) => {
    console.error('[ai-review]', err)
  })
}

async function processAIReviewRun(params: StartAIReviewParams): Promise<void> {
  const {
    db,
    runId,
    requestedByUserId,
    installationGithubId,
    owner,
    repo,
    pullNumber,
    prHtmlUrl,
    repoContext,
    allowApprove,
    reviewStyle,
    checkRunId,
  } = params

  const checkBase = { installationGithubId, owner, repo, checkRunId }

  try {
    await db
      .update(aiReviewRuns)
      .set({ status: 'running' })
      .where(eq(aiReviewRuns.id, runId))

    const config = useRuntimeConfig()
    const master = String(config.encryptionKey || '')
    const apiKey = await getCursorApiKeyForUser(
      db,
      requestedByUserId,
      master,
    )
    if (!apiKey?.trim()) {
      const errMsg = 'Cursor API key missing for requesting user'
      await db
        .update(aiReviewRuns)
        .set({
          status: 'failed',
          error: errMsg,
          finishedAt: new Date(),
        })
        .where(eq(aiReviewRuns.id, runId))
      await finalizeGithubCheck({
        ...checkBase,
        conclusion: 'failure',
        summary: errMsg,
      })
      return
    }

    const token = await getInstallationAccessToken(installationGithubId)
    const result = await cursorReviewer.review({
      apiKey: apiKey.trim(),
      owner,
      repo,
      pullNumber,
      installationToken: token,
      prHtmlUrl,
      repoContext,
      allowApprove,
      reviewStyle,
    })

    await db
      .update(aiReviewRuns)
      .set({
        status: result.status,
        cursorAgentId: result.cursorAgentId,
        summary: result.summary || null,
        error: result.error ?? null,
        finishedAt: new Date(),
      })
      .where(eq(aiReviewRuns.id, runId))

    const text =
      [result.summary, result.error].filter(Boolean).join('\n\n') ||
      '(no output)'
    await finalizeGithubCheck({
      ...checkBase,
      conclusion: result.status === 'succeeded' ? 'success' : 'failure',
      summary: text,
    })
  } catch (e) {
    console.error('[ai-review]', e)
    const msg = e instanceof Error ? e.message : String(e)
    await db
      .update(aiReviewRuns)
      .set({
        status: 'failed',
        error: msg,
        finishedAt: new Date(),
      })
      .where(eq(aiReviewRuns.id, runId))
    await finalizeGithubCheck({
      ...checkBase,
      conclusion: 'failure',
      summary: msg,
    })
  }
}
