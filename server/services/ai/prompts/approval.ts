import type { ReviewInput } from '../types'
import { repoFullName } from './types'

function step5AndConstraintsWhenApproveAllowed(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `## Step 5: Submit the review

Use GitHub MCP to **submit** the PR review (inline comments + review body) with the appropriate event: **APPROVE** or **REQUEST_CHANGES** (or **COMMENT** only if you cannot decide — prefer **REQUEST_CHANGES** when in doubt).

- **Approve** only if correct, adequately tested, no blocking issues (non-blocking suggestions OK).
- **Request changes** for correctness gaps, missing tests for risky changes, security issues, or violations of architecture / persistence rules above.

---

## Tool constraints (mandatory)

- Only interact with **${repo}** pull request **#${input.pullNumber}**. Do not touch other PRs or unrelated issues.
- **Do not** push commits, create branches, or modify the PR branch — you are a reviewer, not a contributor.
- **Do not** approve if you are clearly acting as an automation without human intent — if the GitHub identity would be the bot/app, prefer **REQUEST_CHANGES** or **COMMENT** when unsure.
- If the PR is **merged**, **closed**, or has **no diff**, post a brief comment explaining why you skipped substantive review, or do nothing if already completed.`
}

function step5AndConstraintsWhenApproveDisallowed(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `## Step 5: Submit the review

**Repository policy**: **Do not submit APPROVE under any circumstances** for this repository.

Use GitHub MCP to **submit** the PR review (inline comments + review body) with one of:

- **REQUEST_CHANGES** when there are blocking issues (correctness, security, missing coverage for risky changes, etc.).
- **COMMENT** when there are no blocking issues (non-blocking suggestions, praise, or minor notes).

Never use the **APPROVE** event for this repository.

---

## Tool constraints (mandatory)

- Only interact with **${repo}** pull request **#${input.pullNumber}**. Do not touch other PRs or unrelated issues.
- **Do not** push commits, create branches, or modify the PR branch — you are a reviewer, not a contributor.
- **Do not** use **APPROVE** — this repository has automated approvals disabled.
- **Do not** approve if you are clearly acting as an automation without human intent — if the GitHub identity would be the bot/app, prefer **REQUEST_CHANGES** or **COMMENT** when unsure.
- If the PR is **merged**, **closed**, or has **no diff**, post a brief comment explaining why you skipped substantive review, or do nothing if already completed.`
}

export function buildApprovalSection(input: ReviewInput): string {
  return input.allowApprove
    ? step5AndConstraintsWhenApproveAllowed(input)
    : step5AndConstraintsWhenApproveDisallowed(input)
}
