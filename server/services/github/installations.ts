import { Octokit } from '@octokit/rest'
import { and, eq } from 'drizzle-orm'
import {
  installations,
  repositories,
  userInstallations,
} from '../../db/schema'
import type { Database } from '../../db/client'
import { createInstallationOctokit } from './client'

export type GhRepo = {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch?: string | null
  owner: { login: string }
}

export async function upsertInstallationFromGithub(
  db: Database,
  params: {
    githubInstallationId: number
    accountLogin: string
    accountType: string
    accountId: number
    suspendedAt?: Date | null
  },
) {
  const [inst] = await db
    .insert(installations)
    .values({
      githubInstallationId: params.githubInstallationId,
      accountLogin: params.accountLogin,
      accountType: params.accountType,
      accountId: params.accountId,
      suspendedAt: params.suspendedAt ?? null,
    })
    .onConflictDoUpdate({
      target: installations.githubInstallationId,
      set: {
        accountLogin: params.accountLogin,
        accountType: params.accountType,
        accountId: params.accountId,
        suspendedAt: params.suspendedAt ?? null,
      },
    })
    .returning()
  return inst
}

export async function linkUserToInstallation(
  db: Database,
  userId: number,
  installationId: number,
) {
  await db
    .insert(userInstallations)
    .values({ userId, installationId })
    .onConflictDoNothing()
}

/**
 * Upsert each installation from GitHub and link the user. Used after
 * `GET /user/installations` (user OAuth token) or when processing install webhooks.
 */
export async function applyGithubInstallationsForUser(
  db: Database,
  userId: number,
  ghInstallations: Array<{
    id: number
    account?: { login?: string; type?: string; id: number } | null
    suspended_at?: string | null
  }>,
): Promise<number[]> {
  const linkedIds: number[] = []
  for (const data of ghInstallations) {
    const account = data.account
    if (!account || !('login' in account) || !account.login) continue

    const row = await upsertInstallationFromGithub(db, {
      githubInstallationId: data.id,
      accountLogin: account.login,
      accountType: account.type ?? 'User',
      accountId: account.id,
      suspendedAt: data.suspended_at ? new Date(data.suspended_at) : null,
    })
    if (!row) continue
    await linkUserToInstallation(db, userId, row.id)
    linkedIds.push(row.id)
  }
  return linkedIds
}

/** List app installations the authenticated GitHub user can access; link each to this user. */
export async function syncUserInstallations(
  db: Database,
  userId: number,
  accessToken: string,
): Promise<number[]> {
  const octokit = new Octokit({ auth: accessToken })
  const list = await octokit.paginate(
    octokit.rest.apps.listInstallationsForAuthenticatedUser,
    { per_page: 100 },
  )
  return applyGithubInstallationsForUser(db, userId, list)
}

export async function assertUserOwnsInstallation(
  db: Database,
  userId: number,
  installationId: number,
) {
  const [row] = await db
    .select({ id: installations.id })
    .from(installations)
    .innerJoin(
      userInstallations,
      eq(userInstallations.installationId, installations.id),
    )
    .where(
      and(
        eq(userInstallations.userId, userId),
        eq(installations.id, installationId),
      ),
    )
    .limit(1)
  return row
}

export async function upsertRepositories(
  db: Database,
  installationId: number,
  ghRepos: GhRepo[],
) {
  const now = new Date()
  for (const r of ghRepos) {
    await db
      .insert(repositories)
      .values({
        installationId,
        githubRepoId: r.id,
        owner: r.owner.login,
        name: r.name,
        fullName: r.full_name,
        private: r.private,
        defaultBranch: r.default_branch ?? null,
        lastSyncedAt: now,
      })
      .onConflictDoUpdate({
        target: repositories.githubRepoId,
        set: {
          installationId,
          owner: r.owner.login,
          name: r.name,
          fullName: r.full_name,
          private: r.private,
          defaultBranch: r.default_branch ?? null,
          lastSyncedAt: now,
        },
      })
  }
}

export async function removeRepositoryByGithubId(
  db: Database,
  githubRepoId: number,
) {
  await db.delete(repositories).where(eq(repositories.githubRepoId, githubRepoId))
}

/** Live list from GitHub — does not write to the database. */
export async function fetchReposAccessibleToInstallation(
  githubInstallationId: number,
): Promise<GhRepo[]> {
  const octokit = createInstallationOctokit(githubInstallationId)
  const ghRepos = await octokit.paginate(
    octokit.rest.apps.listReposAccessibleToInstallation,
    { per_page: 100 },
  )
  return ghRepos as GhRepo[]
}

export async function deleteInstallationCascade(
  db: Database,
  githubInstallationId: number,
) {
  await db
    .delete(installations)
    .where(eq(installations.githubInstallationId, githubInstallationId))
}
