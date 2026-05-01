# ReviewForge: GitHub apps and local setup

This guide walks through creating the **GitHub OAuth App** (sign-in), the **GitHub App** (repo access + webhooks), filling `.env`, and running the stack locally with **npm**.

---

## Prerequisites

- **Node.js 22+** and **npm** (bundled with Node)
- **PostgreSQL 16+** (local install, or only the `db` service from `docker compose up -d db`)
- A GitHub account that can create OAuth Apps and GitHub Apps

For local dev, use base URL **`http://localhost:3000`** unless you use a tunnel (then substitute that URL everywhere below).

---

## 1. GitHub OAuth App (user sign-in)

Used by ReviewForge to know **who** is logged in (`nuxt-auth-utils` → `/auth/github`).

1. Open GitHub → **Settings** (your profile) → **Developer settings** → **OAuth Apps** → **New OAuth App**.  
   For an organization: **Organization settings** → **Developer settings** → **OAuth Apps**.

2. Fill in:
   - **Application name**: e.g. `ReviewForge (local)`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/auth/github`  
     (must match exactly; no trailing slash unless you use one consistently everywhere.)

3. Click **Register application**.

4. Copy **Client ID** and create a **Client secret** → copy the secret once.

5. Put them in `.env`:
   ```env
   NUXT_OAUTH_GITHUB_CLIENT_ID=<Client ID>
   NUXT_OAUTH_GITHUB_CLIENT_SECRET=<Client secret>
   ```

6. **Scopes**: Default GitHub OAuth for “Sign in with GitHub” usually includes `read:user` and `user:email`. If GitHub asks for scopes when authorizing, accept what your app requests. Adjust in the OAuth App settings if you tighten permissions.

If redirects fail in production, set **`NUXT_OAUTH_GITHUB_REDIRECT_URL`** to the full callback URL (see [`.env.example`](../.env.example)).

---

## 2. GitHub App (repositories + webhooks)

Used to **list repositories** and **read pull requests** for repos the user selects during install.

1. GitHub → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.

2. **GitHub App name**: e.g. `ReviewForge Local` (must be unique on GitHub).

3. **Homepage URL**: `http://localhost:3000`

4. **Identifying and authorizing users**  
   - Uncheck **“Request user authorization (OAuth) during installation”** if you only use the separate OAuth App for login (ReviewForge’s flow: OAuth first, then install GitHub App).

5. **Webhook**
   - **Active**: checked  
   - **Webhook URL**: `http://localhost:3000/api/webhooks/github`  
     For local dev, GitHub cannot reach `localhost` unless you use a tunnel ([smee.io](https://smee.io), ngrok, Cloudflare Tunnel, etc.) and put that **public** URL here instead.  
   - **Secret**: generate a long random string → same value as `NUXT_GITHUB_WEBHOOK_SECRET` in `.env`.

6. **Repository permissions** (read-only for v1):
   - **Metadata**: Read-only  
   - **Contents**: Read-only  
   - **Pull requests**: Read-only  

7. **Subscribe to events**:
   - **Installation**
   - **Installation repositories**

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

---

## 3. Environment file

```bash
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NUXT_SESSION_PASSWORD` | At least 32 characters (session encryption) |
| `NUXT_OAUTH_GITHUB_CLIENT_ID` / `NUXT_OAUTH_GITHUB_CLIENT_SECRET` | OAuth App |
| `NUXT_PUBLIC_BASE_URL` | e.g. `http://localhost:3000` |
| `NUXT_GITHUB_APP_ID` / `NUXT_GITHUB_APP_PRIVATE_KEY` / `NUXT_GITHUB_WEBHOOK_SECRET` | GitHub App |
| `NUXT_PUBLIC_GITHUB_APP_SLUG` | Slug from `https://github.com/apps/<slug>` |

---

## 4. Run locally (npm)

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

Open **http://localhost:3000** → **Continue with GitHub** → then **Connect repositories** on the dashboard.

### Option B: Full stack in Docker

```bash
cp .env.example .env
# Fill all required variables for the compose file (see docker-compose.yml).

docker compose up --build
```

---

## 5. Verify webhooks locally

GitHub’s servers cannot POST to `http://localhost:3000`. Use a proxy (e.g. [smee.io](https://smee.io)):

1. Create a channel; set the GitHub App **Webhook URL** to the smee URL.
2. Run the smee client forwarding to `http://localhost:3000/api/webhooks/github`.

Without a tunnel, installs still work if you use the **Setup URL** on the same host the browser uses; webhook delivery is optional for first tests but recommended so repo lists stay in sync.

---

## Summary checklist

- [ ] OAuth App callback: `{BASE_URL}/auth/github`
- [ ] GitHub App webhook: `{BASE_URL}/api/webhooks/github` (or tunnel)
- [ ] GitHub App setup URL: `{BASE_URL}/api/auth/github/setup`
- [ ] Permissions: Metadata, Contents, Pull requests (read)
- [ ] Events: Installation, Installation repositories
- [ ] `.env` complete; `npm run db:migrate:prod`; `npm run dev`
