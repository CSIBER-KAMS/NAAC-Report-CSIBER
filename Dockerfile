# CSIBER AQAR — production image.
#
# One always-on Node process. The database is SQLite in a mounted volume, so
# this must never be scaled to more than one replica: concurrent writers would
# corrupt WAL-mode SQLite.

# ---------- deps: build the native better-sqlite3 binary ----------
FROM node:20-bookworm-slim AS deps
WORKDIR /app
# node-gyp needs a toolchain to compile better-sqlite3.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build runs without secrets; AQAR_SECRET is only required at runtime.
RUN npm run build

# ---------- runtime ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    AQAR_DATA_DIR=/data

# The standalone bundle carries only what the server actually needs.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
# better-sqlite3 is externalised from the bundle, so its compiled binary must
# be copied in explicitly rather than relying on file tracing.
COPY --from=build /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=build /app/node_modules/bindings ./node_modules/bindings
COPY --from=build /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# Scripts for migrate/seed/backup, run via `docker compose exec`.
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

RUN mkdir -p /data && chown -R node:node /data /app
USER node

VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# WORKDIR is pinned to /app and AQAR_DATA_DIR to /data, so the data location
# never depends on where the process happens to be started from.
CMD ["node", "server.js"]
