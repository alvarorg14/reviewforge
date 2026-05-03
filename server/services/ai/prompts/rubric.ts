import type { ReviewInput, ReviewStyle } from '../types'
import { repoFullName } from './types'

function rubricThorough(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `## Step 2: Review the diff

Review every changed file. Use enough surrounding context (via MCP) to judge impact, not only the changed hunks.

Evaluate in **priority order**:

### 2.1 Correctness

- Does the change match the PR description / linked issues?
- Logic errors, null/edge cases, regressions, race or async bugs?

### 2.2 Architecture & design

- Clear boundaries between layers (UI vs API vs domain vs persistence) appropriate to this codebase.
- Avoid duplicated business logic; prefer small, composable units.
- Access control and authorization for any user-facing or multi-tenant paths.

### 2.3 Code quality & conventions

- Naming, structure, and consistency with the rest of the repository.
- Avoid obvious footguns (unchecked errors, silent failures, misleading comments).

### 2.4 Testing

- New behavior / bugfixes should have or extend automated tests where practical for this repo.

### 2.5 API & compatibility

- Breaking API or schema changes should be intentional and documented.

### 2.6 Persistence & migrations

- If the repo uses a database: schema changes should follow the project's migration policy (prefer additive, reversible steps).

### 2.7 Performance & reliability

- Obvious N+1 patterns, unbounded work, missing timeouts or retries where relevant.

### 2.8 Security

- Validate and sanitize inputs on trust boundaries; never trust client-only checks for sensitive operations.
- Secrets must not appear in client-visible code, logs, or committed files.

Focus feedback on **${repo}** and this PR only.`
}

function rubricConcise(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `## Step 2: Review the diff

**Concise mode**: Only flag **blocking issues** and **high-value** suggestions. Skip stylistic nits, minor refactors, and optional polish unless they prevent a serious bug or security issue.

Review changed files with enough MCP context to judge impact.

Priority: (1) correctness / regressions, (2) security / auth / data exposure, (3) breaking changes without migration path. De-prioritize everything else.

Keep your final summary (Step 4) to **3–6 short lines** unless blocking issues require more detail.

Scope: **${repo}** PR **#${input.pullNumber}** only.`
}

function rubricSecurity(input: ReviewInput): string {
  const repo = repoFullName(input)
  return `## Step 2: Review the diff

**Security-focused mode**: Treat security as the **primary** lens; correctness and design follow.

Review every changed file with enough surrounding context (via MCP) to judge trust boundaries and data flow.

### 2.1 Security (first)

- **Input validation** on all external inputs (HTTP, webhooks, files, query params, message payloads).
- **Authentication & authorization**: missing checks, IDOR, privilege escalation, insecure defaults.
- **Secret handling**: tokens, keys, passwords in code, env, logs, or client bundles.
- **Injection** risks (SQL, command, template, LDAP, etc.) and unsafe deserialization.
- **SSRF / XXE / path traversal** where URLs, XML, or filesystem paths are involved.
- **Supply chain**: dependency changes, install scripts, pinned vs floating versions.
- **Crypto**: weak algorithms, missing AEAD, improper nonce/IV handling when relevant.

Explicitly note if **security-sensitive** changes lack tests or threat-model notes.

### 2.2 Correctness

- Does the change match the PR description? Logic errors and edge cases that affect safety or integrity.

### 2.3 Architecture & design (security-relevant)

- Trust boundaries, least privilege, defense in depth.

### 2.4 Code quality

- Only where it intersects safety (e.g. error handling that hides failures).

### 2.5 Testing

- Security regressions should have tests or clear justification if not feasible.

### 2.6 API, persistence, performance

- Mention only when tied to security or abuse resistance.

Scope: **${repo}** PR **#${input.pullNumber}** only.`
}

const byStyle: Record<ReviewStyle, (input: ReviewInput) => string> = {
  thorough: rubricThorough,
  concise: rubricConcise,
  security: rubricSecurity,
}

export function buildRubric(input: ReviewInput): string {
  return byStyle[input.reviewStyle](input)
}
