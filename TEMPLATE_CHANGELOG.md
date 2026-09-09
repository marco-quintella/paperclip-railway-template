# Template Changelog

## 2026-09-08

- Changed: Runtime image preinstalls Playwright Chromium system libraries (Debian 13 `t64` set, including `libnspr4`) so agents can launch headless Chromium without root/`apt-get`/`sudo` at runtime.
- Changed: Paperclip pin `v2026.722.0` → `v2026.831.1` (latest stable at bump time; routine upstream uptake). **Upgrade note:** Node.js floor is now **24.11.0** (this image moves to `node:24-trixie-slim`). Releases since v2026.722.0 add many additive DB migrations (`0184`–`0230`: Decisions, Import/Export, adapter device-login, Better Auth `issuer`, native-runner tables, etc.); they run automatically on startup — no manual SQL required for the Railway template’s managed Postgres. Only `0229` discards data (company brand color and per-company attachment size limit). See [paperclip v2026.831.1](https://github.com/paperclipai/paperclip/releases/tag/v2026.831.1) and [v2026.831.0](https://github.com/paperclipai/paperclip/releases/tag/v2026.831.0).
- Changed: Runtime image aligned with [upstream Paperclip production Dockerfile](https://github.com/paperclipai/paperclip/blob/v2026.831.1/Dockerfile) — Node 24, `tini` as PID 1, `gh`, `@moonshot-ai/kimi-code`, and `CLAUDE_LOGIN_EDGE_TLS_TERMINATED=true` for Railway’s TLS-terminating edge. Wrapper starts Paperclip via the workspace `tsx` loader (same as upstream `CMD`).

## 2026-09-05

- Fixed: Railway deploys failed healthchecks with `GET /api/health 403` after Paperclip finished booting. The marketplace/service healthcheck hits the public URL; in `authenticated` + `private` mode Paperclip forbids that path when `X-Forwarded-Host` is the public domain. The wrapper now answers both `/api/health` and `/setup/healthz` from a loopback probe (503 while Paperclip is starting, 200 once it is up) so Railway can mark the replica healthy without changing deployment mode.

## 2026-07-31

- Changed: Paperclip pin `v2026.416.0` → `v2026.722.0` (latest stable at bump time; routine upstream uptake). **Upgrade note:** releases since v2026.416.0 add many additive DB migrations (Connections v3, MCP Tool Gateway, recovery actions, secret providers, etc.); they run automatically on startup — no manual SQL required for the Railway template’s managed Postgres. See [paperclip v2026.722.0 release notes](https://github.com/paperclipai/paperclip/releases/tag/v2026.722.0).
- Changed: Runtime image parity with upstream production Dockerfile — install `@google/gemini-cli`, set `GEMINI_SANDBOX=false`, and add `python3` / `wget` apt packages for agent tooling.

## 2026-04-17

- Fixed: WebSocket proxy upstream errors no longer crash the Node process (#6, duplicate #7) — `http-proxy` can pass a socket on WS failures, which has no `writeHead`; the wrapper now sends JSON 503 only for HTTP responses and destroys the socket otherwise.
- Changed: Paperclip pin `v2026.325.0` → `v2026.416.0` (latest stable at bump time; routine upstream uptake). **Upgrade note:** upstream v2026.416.0 adds migrations including `pg_trgm`; embedded Postgres in this template should allow `CREATE EXTENSION`, but external DB users may need DBA to run `CREATE EXTENSION IF NOT EXISTS pg_trgm;` before upgrade — see [paperclip v2026.416.0 release notes](https://github.com/paperclipai/paperclip/releases/tag/v2026.416.0).
- Changed: Runtime image aligned with [upstream Paperclip production Dockerfile](https://github.com/paperclipai/paperclip/blob/master/Dockerfile) — `HOME=/paperclip`, `PAPERCLIP_INSTANCE_ID`, `PAPERCLIP_CONFIG`, `OPENCODE_ALLOW_ALL_MODELS=true`, and apt packages `git`, `openssh-client`, `jq`, `ripgrep` (agent/git tooling parity).

## 2026-04-02

- Fixed: Claude Code adapter fails with `--dangerously-skip-permissions cannot be used with root/sudo privileges` (#4)
  - Set `CLAUDE_CODE_BUBBLEWRAP=1` in Dockerfile — tells Claude Code it is running inside a container sandbox, bypassing the redundant root check while Docker's own isolation remains active
  - Replaced `gosu` with `setpriv --inh-caps=-all` in entrypoint to properly drop inherited Linux capabilities
  - Removed `gosu` package from Dockerfile (no longer needed; `setpriv` is part of the base image)
