FROM node:20-alpine AS base

# 1. Bağımlılıkları yükle
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

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

# PRISMA İÇİN BU SATIRI EKLE:
COPY --from=builder /app/prisma ./prisma
# Bağımlılıkları ve diğer dosyaları kopyala
# COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]