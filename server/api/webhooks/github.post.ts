import { Webhooks } from '@octokit/webhooks'
import { eq } from 'drizzle-orm'
import { installations } from '../../db/schema'
import {
  deleteInstallationCascade,
  removeRepositoryByGithubId,
  upsertInstallationFromGithub,
} from '../../services/github/installations'

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
    }
  } catch (e) {
    console.error('[webhook/github]', e)
    throw createError({ statusCode: 500, message: 'Webhook handler failed' })
  }

  return { ok: true }
})
