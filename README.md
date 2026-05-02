# jugyoBase

学校単位のクローズドな「授業実践」共有（MVP）。Next.js・PostgreSQL・Google OAuth・S3 互換ストレージ。

## 機能

- 本番では Next.js の **`basePath` が `/jugyobase`**（例: `https://identfill.com/jugyobase/t/{slug}/posts`）。ローカルでも `http://localhost:3000/jugyobase` からアクセスします。
- テナント URL: `/t/{学校スラッグ}/…`（他校データは見えない）
- Google ログイン（**事前登録メール**のみ、任意で `hd` ドメイン制限）
- 投稿: 学年・教科・単元・めあて（必須）、振り返り・POINT・流れ・ハッシュタグ（任意）
- 検索: 学年・教科・単元・タグ・キーワード（`searchText` の部分一致）
- 添付: PDF / スライド / 画像 / 動画（署名付き URL で S3 互換へ直接アップロード）
- 編集・削除は **作成者のみ**（ロールなし運用）

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. PostgreSQL

```bash
docker compose up -d
```

`.env` を作成（`.env.example` を参照）。例:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/jugyoBase"
AUTH_SECRET="$(openssl rand -base64 32)"
AUTH_URL="http://localhost:3000/jugyobase"
AUTH_GOOGLE_ID="（Google Cloud Console のクライアント ID）"
AUTH_GOOGLE_SECRET="（クライアントシークレット）"
```

### 3. マイグレーション

```bash
npm run db:migrate
```

### 4. テナント・ユーザー作成

[docs/TENANT_BOOTSTRAP.md](docs/TENANT_BOOTSTRAP.md) を参照。例:

```bash
npx tsx scripts/create-tenant-user.ts --slug demo --name "デモ小学校" --email you@gmail.com
# 例: demo.school.jp のみ許可する場合
npx tsx scripts/create-tenant-user.ts --slug demo --name "デモ小学校" --email you@demo.school.jp --domain demo.school.jp
```

### 5. ファイルストレージ（MinIO 例）

`docker-compose.yml` の MinIO を起動したうえで:

```bash
S3_BUCKET=jugyoBase
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=minio12345678
S3_ENDPOINT=http://127.0.0.1:9000
```

バケット `jugyoBase` をコンソール（:9001）で作成してください。未設定でも投稿テキストは利用できます（添付のみ不可）。

### 6. 開発サーバー

```bash
npm run dev
```

ルート `http://localhost:3000/jugyobase` でテナントを選ぶか、`http://localhost:3000/jugyobase/t/{slug}/login` に直接アクセスしてログインします。

### Google OAuth の `redirect_uri_mismatch` 対策

Google Cloud Console の OAuth 2.0 クライアントで、環境ごとのリダイレクト URI を登録してください。

- 開発: `http://localhost:3000/jugyobase/api/auth/callback/google`
- 本番（サブパス例）: `https://identfill.com/jugyobase/api/auth/callback/google`

加えて、このリポジトリは開発時に `*_DEV` の環境変数を優先できます。

```bash
# 開発（localhost）用
AUTH_GOOGLE_ID_DEV="..."
AUTH_GOOGLE_SECRET_DEV="..."

# 本番用（既存）
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

`AUTH_URL` はこのアプリのオリジン＋`basePath`（`/jugyobase`）まで含めて実際の実行 URL と一致させてください（開発なら通常 `http://localhost:3000/jugyobase`、本番なら `https://identfill.com/jugyobase`）。

### 本番（サブパス配信・`identfill.com/jugyobase` の例）

- アプリの `basePath` は [`src/lib/app-base-path.ts`](src/lib/app-base-path.ts) と [`next.config.ts`](next.config.ts) で `/jugyobase` に固定しています。
- Nginx で別ポートの Node（例: `127.0.0.1:PORT`）へ渡すときは **`location ^~ /jugyobase/`** とし、**`proxy_pass` の URL に末尾 `/` を付けない**（付けると `/jugyobase` が削られてパスがずれることがあります）。ルート直下へ寄せる場合は `location = /jugyobase { return 301 /jugyobase/; }` など。
- 未ログイン時はトップ（`/jugyobase/`）で DB に登録されたテナント一覧から学校を選び、ログイン済みはそのテナントの投稿一覧へリダイレクトされます。

## ドキュメント

- [docs/TENANT_BOOTSTRAP.md](docs/TENANT_BOOTSTRAP.md) — 手動テナント作成
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — スキーマと検索・RLS

## スクリプト

| コマンド            | 説明                 |
| ------------------- | -------------------- |
| `npm run db:migrate` | `migrate deploy`     |
| `npm run db:generate`| Prisma Client 生成   |
| `npm run db:seed`    | デモ用シード（任意） |
| `npm run tenant:create` | `tsx scripts/create-tenant-user.ts` の短縮 |
| `npm run build`      | 本番ビルド           |
