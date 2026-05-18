# jugyoBase 本番イメージ（Next.js standalone + Prisma）
# ビルド: docker build -t jugyobase:local .
# 実行は deploy/docker-compose.prod.yml の app サービスを参照

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
# postinstall が prisma generate を呼ぶため、スキーマだけ先に置く
COPY prisma ./prisma
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
# prisma generate / next build は実 DB 不要。スキーマ検証用のダミー。
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

# standalone はビルド時の Next と同じバイナリで動かす（runner で npm ci した next だと basePath が壊れる）
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# `docker compose run --rm app npx prisma migrate deploy` 用
COPY package.json package-lock.json ./
COPY prisma ./prisma
# migrate deploy / db:seed（tsx prisma/seed.ts）用
RUN npm install prisma@6.19.3 tsx@4.21.0 --no-save \
  && npx prisma generate

EXPOSE 3000
CMD ["node", "server.js"]
