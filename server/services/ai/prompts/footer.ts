import type { ReviewInput } from '../types'
import { repoFullName } from './types'

export function buildFooter(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `Begin now: fetch PR **#${input.pullNumber}** for **${repo}** from **${input.prHtmlUrl}**, then complete steps 1–5.`
}
