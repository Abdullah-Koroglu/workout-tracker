FROM node:20-alpine AS base

# 1. Bağımlılıkları yükle
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000 --fetch-retries=5

# 2. Build aşaması
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 3. Çalıştırma aşaması
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Runtime'da db push calistirabilmek icin Prisma CLI'yi ekle
RUN npm install -g prisma@6.6.0

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/server.js ./server.js

EXPOSE 3000
ENV PORT 3000
CMD ["sh", "-c", "prisma db push --schema=/app/prisma/schema.prisma --skip-generate && node server.js"]