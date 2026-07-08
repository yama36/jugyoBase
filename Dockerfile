# jugyoBase 本番イメージ（Next.js standalone + Prisma）
# ビルド: docker build -t jugyobase:local .
# 実行は deploy/docker-compose.prod.yml の app サービスを参照

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# postinstall が prisma generate を呼ぶため、スキーマだけ先に置く
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.1.1 --activate
ENV NEXT_TELEMETRY_DISABLED=1
# prisma generate / next build は実 DB 不要。スキーマ検証用のダミー。
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && pnpm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates curl ffmpeg poppler-utils unzip libreoffice-impress \
  && rm -rf /var/lib/apt/lists/*

# standalone はビルド時の Next と同じバイナリで動かす（runner で pnpm install した next だと basePath が壊れる）
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# `docker compose run --rm app prisma migrate deploy` 用
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
# migrate deploy / seed 用 CLI（pnpm add は全依存解決で OOM になるため global のみ）
RUN npm install -g prisma@6.19.3 tsx@4.21.0

EXPOSE 3000
CMD ["node", "server.js"]
