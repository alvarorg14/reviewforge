import { describe, expect, it } from 'vitest'
import { buildReviewPrompt } from '../server/services/ai/prompt'

const baseInput = {
  owner: 'acme',
  repo: 'widgets',
  pullNumber: 42,
  installationToken: 'test-token',
  prHtmlUrl: 'https://github.com/acme/widgets/pull/42',
}

describe('buildReviewPrompt', () => {
  it('includes repository full name and PR number', () => {
    const p = buildReviewPrompt(baseInput)
    expect(p).toContain('acme/widgets')
    expect(p).toContain('#42')
    expect(p).toContain('https://github.com/acme/widgets/pull/42')
  })

  it('requires GitHub MCP and forbids gh CLI', () => {
    const p = buildReviewPrompt(baseInput)
    expect(p).toContain('GitHub MCP')
    expect(p).toContain('do not use `gh` CLI')
  })

  it('mentions ReviewForge stack', () => {
    const p = buildReviewPrompt(baseInput)
    expect(p).toContain('ReviewForge')
    expect(p).toContain('Nuxt 4')
  })
})
