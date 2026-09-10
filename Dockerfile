# ---- deps: install node dependencies ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the Next.js app ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: minimal image with yt-dlp + ffmpeg installed system-wide ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# python3/pip for yt-dlp (the app's core dependency — captions and, for
# the Whisper fallback, audio download), ffmpeg for Whisper's audio
# extraction step. Both are real OS packages here, unlike a serverless
# platform where nothing can be installed at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      ffmpeg \
      ca-certificates \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Don't hardcode PORT — the host (Railway or otherwise) injects its own at
# runtime and the standalone server reads process.env.PORT directly.
#
# HOSTNAME *does* need to be forced to 0.0.0.0: Docker auto-sets $HOSTNAME
# to the container ID, and the standalone server does
# `process.env.HOSTNAME || '0.0.0.0'` — so without this override it binds
# to the container-ID hostname (loopback-only) instead of all interfaces,
# and the platform's proxy gets "connection refused" even though the
# process is genuinely running and logs look fine.
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
