# ReviewForge: GitHub apps and local setup

This guide walks through creating **one GitHub App** that handles **OAuth sign-in** and **repository access + webhooks**, filling `.env`, and running the stack locally with **npm**.

---

## Prerequisites

- **Node.js 24+** and **npm** (bundled with Node)
- **PostgreSQL 16+** (local install, or only the `db` service from `docker compose up -d db`)
- A GitHub account that can create GitHub Apps

For local dev, use base URL **`http://localhost:3000`** unless you use a tunnel (then substitute that URL everywhere below).

---

## Why sign-in uses the GitHub App’s OAuth client

ReviewForge calls GitHub’s [`GET /user/installations`](https://docs.github.com/en/rest/apps/installations#list-app-installations-accessible-to-the-user-access-token) when users sign in and when they click **Sync from GitHub** on the dashboard. That endpoint only accepts access tokens issued for **your GitHub App** (“user-to-server” OAuth).

If **`NUXT_OAUTH_GITHUB_CLIENT_ID`** / **`SECRET`** come from a **standalone OAuth App** (Developer settings → **OAuth Apps**), GitHub returns **403** with a message that the token must be authorized to a GitHub App—in practice, installation sync will not work for teammates who never hit the setup URL.

**Therefore:** Use the GitHub App’s **Client ID** and **Client secret** in `NUXT_OAUTH_GITHUB_*`, not a separate OAuth App.

---

## 1. GitHub App (sign-in + repositories + webhooks)

Used so ReviewForge knows **who** is logged in, can **sync which app installations** your account can access, **list repositories**, **read pull requests**, and (when **AI PR review** is enabled) **submit reviews and inline comments** on GitHub for repos the user selects during install.

1. GitHub → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.

2. **GitHub App name**: e.g. `ReviewForge Local` (must be unique on GitHub).

3. **Homepage URL**: `http://localhost:3000`

4. **Identifying and authorizing users** (required for sign-in and **Sync from GitHub**):
   - **Callback URL** / **Authorization callback URL**: `http://localhost:3000/auth/github`  
     (Must match exactly; no trailing slash unless you use one consistently everywhere.)
   - After you save the app, open the app’s **General** page: copy **Client ID** and create a **Client secret** (under **Client secrets**). Put them in `.env`:
     ```env
     NUXT_OAUTH_GITHUB_CLIENT_ID=<GitHub App Client ID>
     NUXT_OAUTH_GITHUB_CLIENT_SECRET=<GitHub App Client secret>
     ```
   - **Request user authorization (OAuth) during installation**: optional. ReviewForge still signs users in via `/auth/github` using the credentials above. You can leave this unchecked if you prefer the install flow not to trigger an extra OAuth screen at install time.

5. **Webhook**
   - **Active**: checked  
   - **Webhook URL**: `http://localhost:3000/api/webhooks/github`  
     For local dev, GitHub cannot reach `localhost` unless you use a tunnel ([smee.io](https://smee.io), ngrok, Cloudflare Tunnel, etc.) and put that **public** URL here instead.  
   - **Secret**: generate a long random string → same value as `NUXT_GITHUB_WEBHOOK_SECRET` in `.env`.

6. **Repository permissions**:
   - **Metadata**: Read-only (required)
   - **Contents**: Read-only (read files / diffs as needed)
   - **Pull requests**: **Read and write** — required for **AI PR review** (Cursor agent posts a review body, inline comments, and approve / request changes via the GitHub API). Read-only is enough for browsing the PR list only; without write, review submission from the app will fail with `403` / “Resource not accessible by integration”.
   - **Checks**: **Read and write** — creates GitHub **check runs** so PRs show automated review progress (in progress → success/failure when the agent finishes).
   - **Issues**: Read-only — **recommended** so the reviewer can open issues linked from the PR description (the AI prompt asks for that context). Optional if you never link issues in PRs.

   If you **raise** permissions on an app that is already installed, each account or organization must **accept the updated permissions** (GitHub shows a prompt on next use or from **Settings → Applications**).

7. **Subscribe to events**:
   - **Installation**
   - **Installation repositories**
   - **Pull request** — enables **automated** AI reviews when a PR is opened, reopened, or marked ready for review (draft PRs are ignored until they leave draft). Requires repository automation settings in ReviewForge.

8. **Where can this GitHub App be installed?**  
   Choose **Only on this account** for personal testing, or **Any account** if you need org installs.

9. After creation:
   - Note **App ID** → `NUXT_GITHUB_APP_ID`
   - **Generate a private key** (`.pem` file). Put the full PEM in `.env` as `NUXT_GITHUB_APP_PRIVATE_KEY` (use quoted multiline, or a single line with `\n` for newlines). The app also supports base64-encoded PEM without headers (see README / code).
   - The app’s public URL is `https://github.com/apps/<slug>` → set **`NUXT_PUBLIC_GITHUB_APP_SLUG`** to `<slug>` (the short name in the URL).

10. **Post installation / Setup URL** (critical for ReviewForge):
    - In the GitHub App settings, set **Setup URL** (or “Post installation”) to:  
      `http://localhost:3000/api/auth/github/setup`  
      (Again: use your tunnel URL if GitHub cannot call localhost.)
    - After a user installs the app, GitHub sends them here with `?installation_id=...` so ReviewForge can link the installation to the logged-in user and sync repos.

If redirects fail in production, set **`NUXT_OAUTH_GITHUB_REDIRECT_URL`** to the full callback URL (see [`.env.example`](../.env.example)).

**Scopes**: With a GitHub App user access token, GitHub derives permissions from the app’s settings and consent flow. Ensure the default consent screen includes whatever your app lists (typically user profile/email for sign-in). If authorization fails after switching from a standalone OAuth App, have users complete **Sign out** → **Continue with GitHub** once so GitHub issues a new token for the app.

---

## 2. Environment file

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NUXT_SESSION_PASSWORD` | At least 32 characters (session encryption) |
| `NUXT_OAUTH_GITHUB_CLIENT_ID` / `NUXT_OAUTH_GITHUB_CLIENT_SECRET` | **GitHub App** Client ID and Client secret (see §1 step 4) — **not** a standalone OAuth App |
| `NUXT_PUBLIC_BASE_URL` | e.g. `http://localhost:3000` |
| `NUXT_GITHUB_APP_ID` / `NUXT_GITHUB_APP_PRIVATE_KEY` / `NUXT_GITHUB_WEBHOOK_SECRET` | Same GitHub App (App ID, key, webhook secret) |
| `NUXT_PUBLIC_GITHUB_APP_SLUG` | Slug from `https://github.com/apps/<slug>` |
| `NUXT_ENCRYPTION_KEY` (or `ENCRYPTION_KEY`) | At least 32 characters — encrypts **per-user** [Cursor API keys](https://cursor.com/settings) stored in the database for **AI PR review**. Each user adds their own key in **Dashboard → Settings**. Rotating this env invalidates stored keys until users save them again. |
| `NUXT_GITHUB_MCP_REMOTE_URL` (or `GITHUB_MCP_REMOTE_URL`, optional) | GitHub remote MCP base URL (default: `https://api.githubcopilot.com/mcp/`). The app sends `Authorization: Bearer <installation token>`. |

---

## 3. Run locally (npm)

### Option A: Postgres with Docker, app on the host

```bash
# From repo root — start only Postgres
docker compose up -d db

cp .env.example .env
# Edit .env: DATABASE_URL=postgresql://reviewforge:reviewforge@localhost:5432/reviewforge
# plus GitHub + session variables above.

npm install
npm run db:migrate:prod
npm run dev
```

Open **http://localhost:3000** → **Continue with GitHub** → then **Connect repositories** or **Sync from GitHub** on the dashboard (the latter discovers installs your GitHub account can already access).

### Option B: Full stack in Docker

```bash
cp .env.example .env
# Fill all required variables for the compose file (see docker-compose.yml).

docker compose up --build
```

---

## 4. Verify webhooks locally

GitHub’s servers cannot POST to `http://localhost:3000`. Use a proxy (e.g. [smee.io](https://smee.io)):

1. Create a channel; set the GitHub App **Webhook URL** to the smee URL.
2. Run the smee client forwarding to `http://localhost:3000/api/webhooks/github`.

Without a tunnel, installs still work if you use the **Setup URL** on the same host the browser uses; webhook delivery is optional for first tests but recommended so repo lists stay in sync.

---

## Summary checklist

- [ ] **Sign-in OAuth**: Callback `{BASE_URL}/auth/github`, using **this GitHub App’s** Client ID + secret (`NUXT_OAUTH_GITHUB_*`)
- [ ] GitHub App webhook: `{BASE_URL}/api/webhooks/github` (or tunnel)
- [ ] GitHub App setup URL: `{BASE_URL}/api/auth/github/setup`
- [ ] Permissions: Metadata (read), Contents (read), Pull requests (**read & write** for AI review), Issues (read, recommended)
- [ ] Events: Installation, Installation repositories
- [ ] `.env` complete; `npm run db:migrate:prod`; `npm run dev`
