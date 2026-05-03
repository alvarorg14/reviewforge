import { Agent } from '@cursor/sdk'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildReviewPrompt } from './prompts'
import type { IAIReviewer, ReviewInput, ReviewResult } from './types'

export const cursorReviewer: IAIReviewer = {
  id: 'cursor',
  async review(input: ReviewInput): Promise<ReviewResult> {
    const config = useRuntimeConfig()
    const apiKey = String(config.cursorApiKey || '').trim()
    if (!apiKey) {
      throw createError({
        statusCode: 500,
        message:
          'NUXT_CURSOR_API_KEY / CURSOR_API_KEY is not configured (Cursor SDK)',
      })
    }

    const cwd = await mkdtemp(join(tmpdir(), 'reviewforge-ai-'))

    const githubMcpUrl =
      String(config.githubMcpRemoteUrl || '').trim() ||
      'https://api.githubcopilot.com/mcp/'

    const agent = await Agent.create({
      apiKey,
      model: { id: 'composer-2' },
      local: { cwd },
      mcpServers: {
        github: {
          type: 'http',
          url: githubMcpUrl,
          headers: {
            Authorization: `Bearer ${input.installationToken}`,
          },
        },
      },
    })

    try {
      const run = await agent.send(buildReviewPrompt(input))
      const result = await run.wait()
      const cursorAgentId = agent.agentId

      if (result.status === 'finished') {
        return {
          cursorAgentId,
          status: 'succeeded',
          summary: result.result ?? '(no assistant text returned)',
        }
      }
      if (result.status === 'cancelled') {
        return {
          cursorAgentId,
          status: 'cancelled',
          summary: result.result ?? '',
        }
      }
      return {
        cursorAgentId,
        status: 'failed',
        summary: result.result ?? '',
        error: 'Cursor run ended with error status',
      }
    } finally {
      await agent[Symbol.asyncDispose]()
    }
  },
}
