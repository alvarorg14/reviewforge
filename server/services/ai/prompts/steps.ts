import type { ReviewInput } from '../types'
import { repoFullName } from './types'

export function buildSteps(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `## Step 1: Read the PR

- Fetch the pull request for **${repo}** PR **#${input.pullNumber}** using GitHub MCP: title, body, state, labels, head/base refs, and the full diff (\`pulls.get\` + \`pulls.listFiles\` / diff as appropriate via MCP).
- Read the PR description — understand what the author claims and why.
- If the body references GitHub issues, read those issues for requirements or bug context.

---

## Step 3: Write inline comments

For each issue or suggestion, add an **inline review comment** on the specific line(s) in the diff:

- **Blocking issues**: explain what is wrong and suggest a fix when possible.
- **Suggestions**: improvements; use GitHub \`\`\`suggestion\`\`\` blocks when you have concrete code.
- **Questions**: ask when intent is unclear.

Be concise and technical. Skip trivial style nits unless they affect correctness or project rules stated in the repository context above.

---

## Step 4: Write a general review comment

Always post a **summary review comment** on the PR (top-level review body), structured as:

**If approving:**

> **Summary**: …
>
> **What I checked**: …
>
> **Minor suggestions**: … (optional)

**If requesting changes:**

> **Summary**: …
>
> **Blocking issues**: numbered list, reference inline comments.
>
> **Suggestions**: … (optional)

Tone: constructive and professional.`
}
