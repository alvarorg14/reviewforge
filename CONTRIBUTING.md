# Contributing

Thanks for helping improve ReviewForge. Use the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) and run the same checks as CI before opening a PR: `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

## Pull request labels (required)

A GitHub Action ([PR Policy](.github/workflows/pr-policy.yaml)) enforces label rules on every pull request. **Merges to the default branch should stay blocked until the PR Policy check is green** (configure it as a required status check in branch protection if you maintain the repo).

### Required: one `type:*` label

Add **exactly one** of these labels to the PR:

| Label | Use when |
|--------|----------|
| `type: feature` | New user-facing or API behavior |
| `type: bug` | Fixes incorrect behavior |
| `type: enhancement` | Improves existing behavior or DX without being a new “feature” |
| `type: documentation` | Docs, comments, or contributor-facing text only |
| `type: refactor` | Internal change without intended behavior change |
| `type: maintenance` | Tooling, dependencies, CI, chores |
| `type: security` | Security fixes or hardening |

If you open a PR from a **fork**, you may not have permission to add labels in this repository. Comment on the PR with the type you intend (or ask a maintainer); someone with triage access can set the label so the check passes.

### Do not use `status:*` labels on PRs

Labels such as `status: triage`, `status: needs info`, `status: blocked`, `status: ready`, `status: in progress`, and `status: stalled` are reserved for **issues**. Using them on a PR will fail the PR Policy check—remove them from the PR and use issue labels or PR discussion instead.
