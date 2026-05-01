# Contributing to ReviewForge

Thank you for your interest in contributing.

## Development

1. Fork the repository and create a feature branch from `main`.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env` and configure GitHub + database (see [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) and the root [README](./README.md)).
4. Run migrations against your Postgres: `npm run db:migrate:prod` or `npm run db:migrate`.
5. Start the app: `npm run dev`.

## Pull requests

- Keep changes focused and describe the motivation in the PR.
- Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before opening a PR.
- Prefer [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (`feat:`, `fix:`, `docs:`, etc.).

## Code style

- ESLint (`@nuxt/eslint`) and Prettier are configured; run `npm run lint:fix` and `npm run format` as needed.

## Questions

Open a discussion or issue for larger design questions before investing in a big change.
