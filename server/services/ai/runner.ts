import { eq } from 'drizzle-orm'
import type { Database } from '../../db/client'
import { aiReviewRuns } from '../../db/schema'
import { getInstallationAccessToken } from '../github/client'
import { cursorReviewer } from './cursor'
import type { ReviewStyle } from './types'
import { getCursorApiKeyForUser } from './userApiKey'

export type StartAIReviewParams = {
  db: Database
  runId: number
  requestedByUserId: number
  installationGithubId: number
  owner: string
  repo: string
  pullNumber: number
  prHtmlUrl: string
  repoContext?: string | null
  allowApprove: boolean
  reviewStyle: ReviewStyle
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
  } = params

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
      await db
        .update(aiReviewRuns)
        .set({
          status: 'failed',
          error: 'Cursor API key missing for requesting user',
          finishedAt: new Date(),
        })
        .where(eq(aiReviewRuns.id, runId))
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
  } catch (e) {
    console.error('[ai-review]', e)
    await db
      .update(aiReviewRuns)
      .set({
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
        finishedAt: new Date(),
      })
      .where(eq(aiReviewRuns.id, runId))
  }
}
