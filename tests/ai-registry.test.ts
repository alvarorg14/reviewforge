import { describe, expect, it } from 'vitest'
import { getAIReviewers } from '../server/services/ai/registry'

describe('AI reviewer registry', () => {
  it('includes the Cursor placeholder reviewer', () => {
    expect(getAIReviewers().map((r) => r.id)).toContain('cursor')
  })
})
