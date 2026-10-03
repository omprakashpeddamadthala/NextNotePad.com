# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS base
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

#
# ---- deps: install dependencies ----
#
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: this layer only has the manifest files (kept separate from the source copy
# below so it's cached independently), but `postinstall` runs `prisma generate`, which needs
# prisma/schema.prisma — that doesn't exist here yet. The `builder` stage below runs it
# explicitly instead, once the full source has been copied in.
RUN npm ci --ignore-scripts

#
# ---- builder: generate the Prisma client and build the Next.js app ----
#
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma only needs a syntactically valid URL while generating the client and compiling.
ARG DATABASE_URL="postgresql://nextnotepad:nextnotepad@localhost:5432/nextnotepad?schema=public"
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate
RUN npm run build

#
# ---- runner: the production image ----
#
FROM base AS runner
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV PORT=3000
# Full node_modules includes the Prisma CLI used by `npm start` to run `migrate deploy`.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts/deploy-migrations.mjs ./scripts/deploy-migrations.mjs
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json

# Ensure runtime directories have proper ownership for the non-root nextjs user.
RUN chown -R nextjs:nodejs /app/.next /app/node_modules/@prisma/engines
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
