# Deploy and Host Paperclip Latest Version on Railway

Paperclip is an open-source platform for running AI agent companies—org charts, goals, budgets, and autonomous agent workflows in one place. This template ships a pinned latest upstream release with Postgres, persistent storage, authenticated access, and a one-click setup page to create your first admin invite—no SSH or log scraping required.

## About Hosting Paperclip Latest Version

Hosting Paperclip on Railway means running the app service beside managed Postgres, with a volume at `/paperclip` for instance data and agent state. This template builds a pinned upstream Paperclip release in Docker, then starts a small wrapper that proxies traffic, serves `/setup` for admin bootstrap, and exposes `/setup/healthz` for Railway healthchecks. After deploy, open `/setup`, optionally add provider API keys, generate an admin invite URL, and use the app at `/`. Public URL, auth secret, and database wiring are prefilled via Railway reference variables; keep port `3100` and the volume mount aligned with the template defaults.

## Common Use Cases

- Self-host an AI agent company OS with authenticated access and persistent agent state
- Run Claude, Codex, OpenCode, or Gemini local adapters against your own Railway project
- Bootstrap a private Paperclip instance quickly without CLI onboarding or manual invite plumbing

## Dependencies for Paperclip Latest Version Hosting

- [Railway Postgres](https://docs.railway.com/guides/postgresql) — auth, app data, and migrations
- Persistent volume mounted at `/paperclip` — instance config, uploads, and agent workspace data
- Optional provider keys for local adapters: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)

### Deployment Dependencies

- [Paperclip](https://github.com/paperclipai/paperclip) — upstream application
- [Paperclip releases](https://github.com/paperclipai/paperclip/releases) — pinned version source (`PAPERCLIP_REF`)
- [This template repository](https://github.com/marco-quintella/paperclip-railway-template) — Dockerfile, wrapper, and setup UI
- [Railway Dockerfile build variables](https://docs.railway.com/guides/dockerfiles#using-variables-at-build-time) — override `PAPERCLIP_REF` at build time
- Template URL: [https://railway.com/deploy/paperclip-latest-version](https://railway.com/deploy/paperclip-latest-version?referralCode=2Sbs5r&utm_medium=integration&utm_source=template&utm_campaign=generic)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/paperclip-latest-version?referralCode=2Sbs5r&utm_medium=integration&utm_source=template&utm_campaign=generic)

### Implementation Details

The image builds upstream Paperclip from a pinned ref (currently `v2026.722.0`):

```dockerfile
ARG PAPERCLIP_REPO=https://github.com/paperclipai/paperclip.git
ARG PAPERCLIP_REF=v2026.722.0
```

At runtime the wrapper starts Paperclip internally, proxies `/`, and serves setup/health:

| Path | Purpose |
|------|---------|
| `/setup` | Generate the first admin invite URL |
| `/setup/healthz` | Railway healthcheck |
| `/` | Paperclip UI after onboarding |

Required service defaults:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | `${{secret(64, "abcdef0123456789")}}` (or ≥32 chars) |
| `HOST` | `0.0.0.0` |
| `PORT` | `3100` |
| `SERVE_UI` | `true` |
| `PAPERCLIP_HOME` | `/paperclip` |
| `PAPERCLIP_DEPLOYMENT_MODE` | `authenticated` |
| `PAPERCLIP_DEPLOYMENT_EXPOSURE` | `private` |
| `PAPERCLIP_PUBLIC_URL` | `https://${{Paperclip.RAILWAY_PUBLIC_DOMAIN}}` |
| `BETTER_AUTH_BASE_URL` | `https://${{Paperclip.RAILWAY_PUBLIC_DOMAIN}}` |

Networking: public HTTP on port **3100**, healthcheck **`/setup/healthz`**, volume at **`/paperclip`**.

## Why Deploy Paperclip Latest Version on Railway?

<!-- Recommended: Keep this section as shown below -->
Railway is a singular platform to deploy your infrastructure stack. Railway will host your infrastructure so you don't have to deal with configuration, while allowing you to vertically and horizontally scale it.

By deploying Paperclip Latest Version on Railway, you are one step closer to supporting a complete full-stack application with minimal burden. Host your servers, databases, AI agents, and more on Railway.
<!-- End recommended section -->

---

## Deploy

1. Click the Deploy button above (or use the template URL). Railway will create a new project from this template.
2. In the template editor, **leave the suggested env vars as-is** (see [Required variables](#required-variables) if you need to edit them).
3. Ensure the **Paperclip** service has:
   - **HTTP proxy** on port `3100`
   - **Healthcheck path** `/setup/healthz`
   - A **volume** mounted at `/paperclip` (for app data)
4. Deploy. Once the service is live, open your app URL and go to **`/setup`**.

## What to do after deploy

1. Open your app’s public URL (e.g. `https://your-app.up.railway.app`).
2. Go to **`/setup`**.
3. (Optional) If you want AI agents immediately, complete Step 1 on setup:
   - set `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` (and/or `GEMINI_API_KEY`) in Railway variables
   - run Codex login from setup (Claude uses `ANTHROPIC_API_KEY` directly)
4. Click **“Generate admin invite URL”**. The page will show a one-time invite link.
5. Open that link and complete sign-up. That account is the first admin.
6. From then on, use the app at **`/`**.

You only need the setup page once to bootstrap the first admin. Don’t share `/setup` publicly if you don’t want others generating invite links.

## Required variables

Set these on the **Paperclip** service in Railway (template editor or service Variables). The template may prefill some; adjust if your setup differs.

| Variable | What to set | Why |
|----------|-------------|-----|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Links Paperclip to the Postgres service. |
| `BETTER_AUTH_SECRET` | e.g. `${{secret(64, "abcdef0123456789")}}` or a long random string | Auth cookies/sessions. Must be at least 32 characters. |
| `HOST` | `0.0.0.0` | Bind so Railway’s proxy can reach the app. |
| `PORT` | `3100` | Must match the proxy. |
| `SERVE_UI` | `true` | Serve the web UI. |
| `PAPERCLIP_HOME` | `/paperclip` | Data directory; must match the volume mount. |
| `PAPERCLIP_DEPLOYMENT_MODE` | `authenticated` | Require login (recommended). |
| `PAPERCLIP_DEPLOYMENT_EXPOSURE` | `private` | Private deployment (recommended). |
| `PAPERCLIP_PUBLIC_URL` | `https://${{Paperclip.RAILWAY_PUBLIC_DOMAIN}}` | Public URL (no trailing slash). |
| `BETTER_AUTH_BASE_URL` | `https://${{Paperclip.RAILWAY_PUBLIC_DOMAIN}}` | Auth callbacks. |

Optional (for AI agents):

- **`OPENAI_API_KEY`** — Codex adapter / startup Codex login
- **`ANTHROPIC_API_KEY`** — Claude adapter
- **`GEMINI_API_KEY`** (or `GOOGLE_API_KEY`) — Gemini adapter (`gemini_local`); Google requires keys restricted to the Gemini API

## Updating the upstream Paperclip version

```bash
GITHUB_TOKEN=... node scripts/bump-paperclip-ref.mjs
```

Then rebuild and redeploy. To pin a different release without forking, set build-time **`PAPERCLIP_REF`** (Railway service variable or `docker build --build-arg`) to a tag from [paperclipai/paperclip](https://github.com/paperclipai/paperclip), then trigger a **new build**.

```bash
docker build --build-arg PAPERCLIP_REF=v2026.722.0 -t paperclip-railway-template .
```

## Local test (developers)

From the repo root, after building the image:

```bash
docker network create paperclip_net
docker run --rm -d --name paperclip_pg --network paperclip_net \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=paperclip \
  postgres:16
# Wait a few seconds for Postgres to be ready, then:
docker run --rm -d --name paperclip_app --network paperclip_net -p 3100:3100 \
  -e DATABASE_URL=postgresql://postgres:postgres@paperclip_pg:5432/paperclip \
  -e HOST=0.0.0.0 -e PORT=3100 -e SERVE_UI=true \
  -e PAPERCLIP_HOME=/paperclip \
  -e PAPERCLIP_DEPLOYMENT_MODE=authenticated -e PAPERCLIP_DEPLOYMENT_EXPOSURE=private \
  -e PAPERCLIP_PUBLIC_URL=http://localhost:3100 -e BETTER_AUTH_BASE_URL=http://localhost:3100 \
  -e BETTER_AUTH_SECRET=local-dev-secret-32chars-min \
  -v paperclip_local_data:/paperclip \
  paperclip-railway-template
```

Open `http://localhost:3100/setup` and use “Generate admin invite URL” to test. Stop with:

```bash
docker stop paperclip_app paperclip_pg
```

## Support

- **This template / deploy issues:** [this repo’s Issues](https://github.com/marco-quintella/paperclip-railway-template/issues).
- **Paperclip app bugs and features:** [paperclipai/paperclip Issues](https://github.com/paperclipai/paperclip/issues).
