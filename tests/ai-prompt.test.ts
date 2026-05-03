import { describe, expect, it } from 'vitest'
import { buildReviewPrompt } from '../server/services/ai/prompts'

const baseInput = {
  owner: 'acme',
  repo: 'widgets',
  pullNumber: 42,
  installationToken: 'test-token',
  prHtmlUrl: 'https://github.com/acme/widgets/pull/42',
  repoContext: null as string | null,
  allowApprove: true,
  reviewStyle: 'thorough' as const,
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

  it('includes no-extra-context note when repoContext is empty', () => {
    const p = buildReviewPrompt({ ...baseInput, repoContext: null })
    expect(p).toContain('No extra repository context was configured')
  })

  it('injects repo context when provided', () => {
    const p = buildReviewPrompt({
      ...baseInput,
      repoContext: 'Stack: Go + Postgres. Prefer table-driven tests.',
    })
    expect(p).toContain('Stack: Go + Postgres')
    expect(p).toContain('provided by the repository owner')
  })

  it('forbids APPROVE when allowApprove is false', () => {
    const p = buildReviewPrompt({ ...baseInput, allowApprove: false })
    expect(p).toContain('Do not submit APPROVE')
    expect(p).toContain('Never use the **APPROVE** event')
  })

  it('uses concise rubric when reviewStyle is concise', () => {
    const p = buildReviewPrompt({ ...baseInput, reviewStyle: 'concise' })
    expect(p).toContain('Concise mode')
  })

  it('uses security rubric when reviewStyle is security', () => {
    const p = buildReviewPrompt({ ...baseInput, reviewStyle: 'security' })
    expect(p).toContain('Security-focused mode')
    expect(p).toContain('Authentication & authorization')
  })
})
