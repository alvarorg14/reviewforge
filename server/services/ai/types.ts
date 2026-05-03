export type ReviewInput = {
  owner: string
  repo: string
  pullNumber: number
  installationToken: string
  prHtmlUrl: string
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
