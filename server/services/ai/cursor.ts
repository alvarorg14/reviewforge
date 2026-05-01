import type { IAIReviewer, ReviewInput, ReviewResult } from './types'

/** Placeholder for Cursor SDK integration (v2). */
export const cursorReviewer: IAIReviewer = {
  id: 'cursor',
  async review(_input: ReviewInput): Promise<ReviewResult> {
    return {
      summary: 'Cursor-based reviews are not enabled yet.',
      findings: [],
    }
  },
}
