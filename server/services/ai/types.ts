export type ReviewInput = {
  owner: string
  repo: string
  pullNumber: number
  headSha: string
  baseSha: string
}

export type ReviewResult = {
  summary: string
  findings: Array<{ severity: 'info' | 'warn' | 'error'; message: string }>
}

export interface IAIReviewer {
  readonly id: string
  review(input: ReviewInput): Promise<ReviewResult>
}
