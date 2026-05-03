import type { ReviewInput } from '../types'

export function buildContextSection(input: ReviewInput): string {
  const trimmed = (input.repoContext ?? '').trim()
  if (trimmed.length > 0) {
    return `## Repository context

The following was provided by the repository owner / maintainers. Treat it as authoritative for stack, conventions, and review priorities for **this** repository (not any other project):

${trimmed}`
  }
  return `## Repository context

No extra repository context was configured. Rely on the PR description, linked issues, and the diff alone to infer stack and conventions.`
}
