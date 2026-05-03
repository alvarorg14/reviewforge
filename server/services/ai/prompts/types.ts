import type { ReviewInput } from '../types'

export type PromptSection = (input: ReviewInput) => string | null

export function repoFullName(input: ReviewInput): string {
  return `${input.owner}/${input.repo}`
}
