import { Webhooks } from '@octokit/webhooks'
import { and, eq, inArray } from 'drizzle-orm'
import { aiReviewRuns, installations, repositories } from '../../db/schema'
import {
  deleteInstallationCascade,
  removeRepositoryByGithubId,
  upsertInstallationFromGithub,
} from '../../services/github/installations'
import { userHasStoredCursorApiKey } from '../../services/ai/userApiKey'
import { isReviewStyle } from '../../services/ai/types'
import { startAIReviewRunInBackground } from '../../services/ai/runner'
import { createInstallationOctokit } from '../../services/github/client'
import {
  createFinishedCheckRun,
  createInProgressCheckRun,
} from '../../services/github/checks'

export default defineEventHandler(async (event) => {
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, message: 'Method not allowed' })
  }

  const config = useRuntimeConfig()
  const secret = String(config.githubWebhookSecret || '')
  if (!secret) {
    throw createError({
      statusCode: 500,
      message: 'GITHUB_WEBHOOK_SECRET is not configured',
    })
  }

  const signature = getHeader(event, 'x-hub-signature-256')
  const delivery = getHeader(event, 'x-github-delivery')
  const eventName = getHeader(event, 'x-github-event')
  const rawBody = (await readRawBody(event))?.toString() ?? ''

  if (!signature || !delivery || !eventName) {
    throw createError({ statusCode: 400, message: 'Missing GitHub headers' })
  }

  const webhooks = new Webhooks({ secret })
  const verified = webhooks.verify(rawBody, signature)
  if (!verified) {
    throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  const db = useDb()
  const payload = JSON.parse(rawBody) as Record<string, unknown>

  try {
    if (eventName === 'installation') {
      const action = String(payload.action)
      const inst = payload.installation as {
        id: number
        account?: { login?: string; type?: string; id?: number }
        suspended_at?: string | null
      }

      if (action === 'deleted') {
        await deleteInstallationCascade(db, inst.id)
      } else if (action === 'suspend') {
        await upsertInstallationFromGithub(db, {
          githubInstallationId: inst.id,
          accountLogin: inst.account?.login ?? 'unknown',
          accountType: inst.account?.type ?? 'User',
          accountId: Number(inst.account?.id ?? 0),
          suspendedAt: new Date(),
        })
      } else if (action === 'unsuspend') {
        await upsertInstallationFromGithub(db, {
          githubInstallationId: inst.id,
          accountLogin: inst.account?.login ?? 'unknown',
          accountType: inst.account?.type ?? 'User',
          accountId: Number(inst.account?.id ?? 0),
          suspendedAt: null,
        })
      } else if (action === 'created') {
        await upsertInstallationFromGithub(db, {
          githubInstallationId: inst.id,
          accountLogin: inst.account?.login ?? 'unknown',
          accountType: inst.account?.type ?? 'User',
          accountId: Number(inst.account?.id ?? 0),
          suspendedAt: null,
        })
      }
    } else if (eventName === 'installation_repositories') {
      const action = String(payload.action)
      const inst = payload.installation as { id: number }
      const [installationRow] = await db
        .select({ id: installations.id })
        .from(installations)
        .where(eq(installations.githubInstallationId, inst.id))
        .limit(1)
      if (!installationRow) {
        return { ok: true, skipped: true }
      }
      if (action === 'added') {
        // Repos are user-imported only via the app; newly granted access does not auto-import.
      } else if (action === 'removed') {
        const removed = (payload.repositories_removed ?? []) as Array<{ id: number }>
        for (const r of removed) {
          await removeRepositoryByGithubId(db, r.id)
        }
      }
    } else if (eventName === 'pull_request') {
      const action = String(payload.action)
      if (!['opened', 'reopened', 'ready_for_review'].includes(action)) {
        return { ok: true, skipped: true }
      }

      const pr = payload.pull_request as {
        number: number
        draft?: boolean
        head: { sha: string }
        html_url: string
      }
      const ghRepo = payload.repository as {
        id: number
        name: string
        owner: { login: string }
      }

      if (pr.draft) {
        return { ok: true, skipped: true }
      }

      const [repoRow] = await db
        .select({ repo: repositories, installation: installations })
        .from(repositories)
        .innerJoin(
          installations,
          eq(repositories.installationId, installations.id),
        )
        .where(eq(repositories.githubRepoId, ghRepo.id))
        .limit(1)

      if (!repoRow?.repo.autoReviewEnabled) {
        return { ok: true, skipped: true }
      }

      if (repoRow.installation.suspendedAt) {
        return { ok: true, skipped: true }
      }

      const actorUserId =
        repoRow.repo.autoReviewUserId ??
        repoRow.installation.defaultAutoReviewUserId ??
        null

      const owner = ghRepo.owner.login
      const repoName = ghRepo.name
      const octokit = createInstallationOctokit(
        repoRow.installation.githubInstallationId,
      )

      const pub = useRuntimeConfig().public
      const base = String(pub.baseUrl || '').replace(/\/$/, '')
      const detailsUrl = base
        ? `${base}/dashboard/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/pulls/${pr.number}`
        : null

      if (!actorUserId) {
        await createFinishedCheckRun(octokit, {
          owner,
          repo: repoName,
          headSha: pr.head.sha,
          conclusion: 'failure',
          summary:
            'Automated AI review is enabled but no reviewer account is configured. Link the GitHub App from ReviewForge (sets an installation default) or choose a reviewer in this repository’s AI review settings.',
          detailsUrl,
        })
        return { ok: true }
      }

      const hasKey = await userHasStoredCursorApiKey(db, actorUserId)
      if (!hasKey) {
        await createFinishedCheckRun(octokit, {
          owner,
          repo: repoName,
          headSha: pr.head.sha,
          conclusion: 'failure',
          summary:
            'The configured reviewer has no Cursor API key stored in ReviewForge. Add a key under Settings or pick another reviewer in repository settings.',
          detailsUrl,
        })
        return { ok: true }
      }

      const dup = await db
        .select({ id: aiReviewRuns.id })
        .from(aiReviewRuns)
        .where(
          and(
            eq(aiReviewRuns.repositoryId, repoRow.repo.id),
            eq(aiReviewRuns.prNumber, pr.number),
            inArray(aiReviewRuns.status, ['pending', 'running']),
          ),
        )
        .limit(1)

      if (dup[0]) {
        return { ok: true, skipped: true }
      }

      const reviewStyle = repoRow.repo.aiReviewStyle
      if (!isReviewStyle(reviewStyle)) {
        console.error(
          '[webhook/github] invalid aiReviewStyle for repository',
          repoRow.repo.id,
        )
        return { ok: true, skipped: true }
      }

      const [inserted] = await db
        .insert(aiReviewRuns)
        .values({
          repositoryId: repoRow.repo.id,
          prNumber: pr.number,
          requestedByUserId: actorUserId,
          status: 'pending',
          prHeadSha: pr.head.sha,
          reviewTrigger: 'auto',
        })
        .returning({ id: aiReviewRuns.id })

      if (!inserted) {
        throw new Error('Failed to insert AI review run')
      }

      let checkRunId: number
      try {
        checkRunId = await createInProgressCheckRun(octokit, {
          owner,
          repo: repoName,
          headSha: pr.head.sha,
          detailsUrl,
        })
      } catch (e) {
        console.error('[webhook/github] createInProgressCheckRun', e)
        await db
          .update(aiReviewRuns)
          .set({
            status: 'failed',
            error: e instanceof Error ? e.message : String(e),
            finishedAt: new Date(),
          })
          .where(eq(aiReviewRuns.id, inserted.id))
        throw e
      }

      await db
        .update(aiReviewRuns)
        .set({ githubCheckRunId: checkRunId })
        .where(eq(aiReviewRuns.id, inserted.id))

      startAIReviewRunInBackground({
        db,
        runId: inserted.id,
        requestedByUserId: actorUserId,
        installationGithubId: repoRow.installation.githubInstallationId,
        owner,
        repo: repoName,
        pullNumber: pr.number,
        prHtmlUrl: pr.html_url,
        repoContext: repoRow.repo.aiContext,
        allowApprove: repoRow.repo.aiAllowApprove,
        reviewStyle,
        checkRunId,
      })

      return { ok: true, runId: inserted.id }
    }
  } catch (e) {
    console.error('[webhook/github]', e)
    throw createError({ statusCode: 500, message: 'Webhook handler failed' })
  }

  return { ok: true }
})
