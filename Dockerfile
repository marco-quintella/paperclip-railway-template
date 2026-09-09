# Build upstream Paperclip from a pinned ref.
FROM node:24-trixie-slim AS paperclip-build
RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    cargo \
    curl \
    git \
    rustc \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

ARG PAPERCLIP_REPO=https://github.com/paperclipai/paperclip.git
ARG PAPERCLIP_REF=v2026.831.1

WORKDIR /paperclip
RUN git clone --depth 1 --branch "${PAPERCLIP_REF}" "${PAPERCLIP_REPO}" .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @paperclipai/ui build
RUN pnpm --filter @paperclipai/plugin-sdk build
# Match upstream production Dockerfile: server build stamps commit via this ARG
# (empty here; the clone still has .git for git-describe fallbacks).
ARG PAPERCLIP_BUILD_COMMIT=""
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm --filter @paperclipai/server build
RUN test -f server/dist/index.js
RUN rm -rf packages/paperclip-runner/runner/target

# Runtime image (direct Paperclip server, no wrapper).
FROM node:24-trixie-slim
ENV NODE_ENV=production
ENV CLAUDE_CODE_BUBBLEWRAP=1
# Railway (and similar) terminate TLS at the edge; Paperclip's Claude login
# transport guard otherwise warns that the in-cluster hop is plain HTTP.
ENV CLAUDE_LOGIN_EDGE_TLS_TERMINATED=true
# Match upstream production image defaults (paperclipai/paperclip Dockerfile) so
# agent tooling, OpenCode/Gemini, and config paths behave the same in containers.
ENV HOME=/paperclip \
    PAPERCLIP_INSTANCE_ID=default \
    PAPERCLIP_CONFIG=/paperclip/instances/default/config.json \
    OPENCODE_ALLOW_ALL_MODELS=true \
    GEMINI_SANDBOX=false

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gh \
    git \
    jq \
    openssh-client \
    python3 \
    ripgrep \
    tini \
    util-linux-extra \
    wget \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

WORKDIR /app
COPY --from=paperclip-build /paperclip /app

WORKDIR /wrapper
COPY package.json /wrapper/package.json
RUN npm install --omit=dev && npm cache clean --force
COPY src /wrapper/src
COPY scripts/entrypoint.sh /wrapper/entrypoint.sh
COPY scripts/bootstrap-ceo.mjs /wrapper/template/bootstrap-ceo.mjs
RUN chmod +x /wrapper/entrypoint.sh

# Optional local adapters/tools parity with upstream Dockerfile.
RUN npm install --global --omit=dev @anthropic-ai/claude-code@latest @openai/codex@latest opencode-ai @google/gemini-cli@latest @moonshot-ai/kimi-code@latest
RUN mkdir -p /paperclip \
    && chown -R node:node /app /paperclip /wrapper

# Railway sets PORT at runtime and this process binds to it.
# tini is PID 1 so agent-spawned orphans are reaped (upstream production image).
# Entrypoint then drops caps and execs as node.
EXPOSE 3100
ENTRYPOINT ["/usr/bin/tini", "--", "/wrapper/entrypoint.sh"]
CMD ["node", "/wrapper/src/server.js"]
