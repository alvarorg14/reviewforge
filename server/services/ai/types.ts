export type ReviewStyle = 'concise' | 'thorough' | 'security'

export const REVIEW_STYLES: readonly ReviewStyle[] = [
  'concise',
  'thorough',
  'security',
] as const

export function isReviewStyle(value: string): value is ReviewStyle {
  return (REVIEW_STYLES as readonly string[]).includes(value)
}

export type ReviewInput = {
  owner: string
  repo: string
  pullNumber: number
  installationToken: string
  prHtmlUrl: string
  /** Per-repo markdown context from DB (`repositories.ai_context`). */
  repoContext?: string | null
  allowApprove: boolean
  reviewStyle: ReviewStyle
}

export type ReviewRunTerminalStatus = 'succeeded' | 'failed' | 'cancelled'

export type ReviewResult = {
  cursorAgentId: string
  status: ReviewRunTerminalStatus
  summary: string
  error?: string
}

export interface IAIReviewer {
  readonly id: string
  review(input: ReviewInput): Promise<ReviewResult>
}
