import type { ReviewInput } from '../types'
import { buildApprovalSection } from './approval'
import { buildContextSection } from './context'
import { buildFooter } from './footer'
import { buildHeader } from './header'
import { buildRubric } from './rubric'
import { buildSteps } from './steps'
import type { PromptSection } from './types'

const SEP = '\n\n---\n\n'

const sections: PromptSection[] = [
  buildHeader,
  buildContextSection,
  buildRubric,
  buildSteps,
  buildApprovalSection,
  buildFooter,
]

/**
 * System-style task for the Cursor agent: review one PR via GitHub MCP and post the review on GitHub.
 */
export function buildReviewPrompt(input: ReviewInput): string {
  return sections
    .map((fn) => fn(input))
    .filter((s): s is string => s != null && s.length > 0)
    .join(SEP)
}
