import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'

export function normalizePrivateKey(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.includes('BEGIN')) {
    return trimmed.replace(/\\n/g, '\n')
  }
  try {
    return Buffer.from(trimmed, 'base64').toString('utf-8')
  } catch {
    return trimmed
  }
}

export function createAppJwtOctokit(): Octokit {
  const config = useRuntimeConfig()
  const appId = Number(config.githubAppId)
  const privateKey = normalizePrivateKey(String(config.githubAppPrivateKey))
  if (!appId || !privateKey) {
    throw createError({
      statusCode: 500,
      message: 'GitHub App is not configured (githubAppId / githubAppPrivateKey)',
    })
  }
  return new Octokit({
    authStrategy: createAppAuth,
    auth: { appId, privateKey },
  })
}

export function createInstallationOctokit(installationGithubId: number): Octokit {
  const config = useRuntimeConfig()
  const appId = Number(config.githubAppId)
  const privateKey = normalizePrivateKey(String(config.githubAppPrivateKey))
  if (!appId || !privateKey) {
    throw createError({
      statusCode: 500,
      message: 'GitHub App is not configured',
    })
  }
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId: installationGithubId,
    },
  })
}

/** Short-lived token for GitHub API / MCP (installation-scoped). */
export async function getInstallationAccessToken(
  installationGithubId: number,
): Promise<string> {
  const octokit = createAppJwtOctokit()
  const { data } = await octokit.rest.apps.createInstallationAccessToken({
    installation_id: installationGithubId,
  })
  if (!data.token) {
    throw createError({
      statusCode: 500,
      message: 'Failed to mint GitHub installation token',
    })
  }
  return data.token
}
