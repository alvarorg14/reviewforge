import type { IAIReviewer } from './types'
import { cursorReviewer } from './cursor'

const reviewers: IAIReviewer[] = [cursorReviewer]

export function getAIReviewers(): IAIReviewer[] {
  return reviewers
}

export function getAIReviewer(id: string): IAIReviewer | undefined {
  return reviewers.find((r) => r.id === id)
}
