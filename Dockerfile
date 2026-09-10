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


# Don't hardcode PORT/EXPOSE — the host (Railway or otherwise) injects its
# own PORT at runtime, and the standalone server reads process.env.PORT
# directly. A hardcoded value here previously caused Railway's static
# Dockerfile inspection to route to the wrong port than the one the
# container actually bound at runtime.
CMD ["node", "server.js"]
