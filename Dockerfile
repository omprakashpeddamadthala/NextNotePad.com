# syntax=docker/dockerfile:1

# Same Debian base for every stage — better-sqlite3 compiles a native .node binary in the
# `deps` stage, and it must stay ABI-compatible (same libc) all the way to `runner`. An
# Alpine (musl) runtime stage here would silently break at startup.
ARG NODE_IMAGE=node:20-bookworm-slim

#
# ---- deps: install dependencies (needs build tools for better-sqlite3's native addon) ----
#
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# --ignore-scripts: this layer only has the manifest files (kept separate from the source copy
# below so it's cached independently), but `postinstall` runs `prisma generate`, which needs
# prisma/schema.prisma — that doesn't exist here yet. The `builder` stage below runs it
# explicitly instead, once the full source has been copied in.
RUN npm ci --ignore-scripts
# --ignore-scripts above also skips better-sqlite3's own install script (which compiles its
# native .node addon), not just the top-level `postinstall` it was meant to defer — without this,
# the addon is never built and every Prisma query fails at runtime with "Could not locate the
# bindings file".
RUN npm rebuild better-sqlite3

#
# ---- builder: generate the Prisma client and build the Next.js app ----
#
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Real secrets aren't needed to build — nothing at build time calls the code paths that read
# them (they're read inside route handlers, at request time, not at module load). Prisma's own
# config does need *a* DATABASE_URL to generate the client against, so a placeholder is enough.
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate
RUN npm run build

#
# ---- runner: the production image ----
#
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV PORT=3000
# Points at the mounted volume below — override at `docker run` time if you point DATABASE_URL
# somewhere else (e.g. a bind mount, or eventually Postgres).
ENV DATABASE_URL="file:/app/data/dev.db"

# Full node_modules (including the `prisma` CLI, needed below for `migrate deploy` on startup) —
# copied as-is from `builder` rather than a fresh `npm ci --omit=dev`, so the native
# better-sqlite3 binary that was compiled there is reused verbatim, not rebuilt.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

# `prisma migrate deploy` (below) lazily downloads the schema-engine binary into
# node_modules/@prisma/engines on first run, since `prisma generate` at build time only
# fetches what the client needs. node_modules is still root-owned from the COPY above, so
# without this chown the non-root `nextjs` user fails to write it and crash-loops.
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data /app/.next /app/node_modules/@prisma/engines
USER nextjs

EXPOSE 3000
VOLUME ["/app/data"]

# Applies any pending migrations against the mounted volume's DB before every start — safe to
# run on every container start (a no-op once already up to date).
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
