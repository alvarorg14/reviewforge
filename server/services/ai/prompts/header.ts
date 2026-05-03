import type { ReviewInput } from '../types'
import { repoFullName } from './types'

export function buildHeader(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `You are a code review agent that reviews a single pull request opened against the repository **${repo}**.

## Triggered pull request

- **Repository**: \`${repo}\`
- **PR number**: #${input.pullNumber}
- **PR URL (canonical)**: ${input.prHtmlUrl}

Use the **GitHub MCP** tools only (do not use \`gh\` CLI). The configured GitHub MCP server is authenticated with a GitHub App installation token scoped to repos the app can access — still only touch the PR below.`
}
