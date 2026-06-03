FROM node:20-bookworm-slim AS base

# 1. Bağımlılıkları yükle
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --legacy-peer-deps --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-retries=5
RUN ./node_modules/.bin/prisma generate --schema=/app/prisma/schema.prisma

# 2. Build aşaması
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Guard against stale local build artifacts leaking into container context.
RUN rm -rf .next && rm -f tsconfig.tsbuildinfo
RUN npm run build

# 3. Çalıştırma aşaması
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/server.js ./server.js

# Ensure upload directories exist
RUN mkdir -p /app/public/uploads/avatars /app/public/uploads/meals /app/public/uploads/checkins && \
    chmod -R 755 /app/public/uploads

EXPOSE 3000
ENV PORT 3000
CMD ["./node_modules/.bin/next", "start"]
