# テナント・ユーザーの手動作成（運用手順）

学校 1 校 = 1 テナント。ログインできるのは **事前に DB に登録されたメールアドレス** のみです（Google OAuth 後に既存 `User` と紐づく）。

## 前提

- PostgreSQL が起動していること（例: `docker compose up -d`）
- マイグレーション適用済み（`npm run db:migrate`）
- Google OAuth のクライアント ID / シークレットが `.env` に設定されていること

## 手順 A: CLI スクリプト（推奨）

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/jugyoBase"
npx tsx scripts/create-tenant-user.ts --slug my-school --name "○○小学校" --email teacher@school.example
# ドメイン制限をかける場合
npx tsx scripts/create-tenant-user.ts --slug my-school --name "○○小学校" --email teacher@school.example --domain school.example
```

- `--slug`: URL に使う英数字（例 `/t/my-school/login`）
- `--name`: 学校表示名
- `--email`: ログインに使う Google アカウントのメール（小文字で保存されます）
- `--domain` (任意): Google hosted domain 制限。指定時はそのドメインのメールだけ許可します。

既に同じ `slug` のテナントがある場合は名前のみ更新し、同じメールのユーザーがいれば `tenantId` / `tenantSlug` を更新します。

## 手順 B: Prisma Studio

```bash
npm run db:studio
```

1. `Tenant` を追加（`id` は UUID 文字列、`slug` は一意）
2. `User` を追加（`email` は全体一意、`tenantId` を上記 Tenant の `id`、`tenantSlug` を Tenant の `slug` と**同一文字列**にする）

## ログイン URL

```
https://（ホスト）/t/{slug}/login
```

ローカル例: `http://localhost:3000/jugyobase`（テナント一覧）または `http://localhost:3000/jugyobase/t/my-school/login`

## 注意

- **メールはアプリ全体で一意**です（MVP）。同一人物が複数校に所属する場合は別メールか、後続でデータモデルを拡張してください。
- `User.tenantSlug` は `Tenant.slug` と常に一致させてください（JWT とミドルウェアの照合に使います）。
