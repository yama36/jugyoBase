# jugyoBase

学校単位のクローズドな「授業実践」共有（MVP）。Next.js・PostgreSQL・Google OAuth・S3 互換ストレージ。

## 機能

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
AUTH_URL="http://localhost:3000"
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

`/t/{slug}/login` にアクセスしてログインします。

### Google OAuth の `redirect_uri_mismatch` 対策

Google Cloud Console の OAuth 2.0 クライアントで、環境ごとのリダイレクト URI を登録してください。

- 開発: `http://localhost:3000/api/auth/callback/google`
- 本番: `https://<your-domain>/api/auth/callback/google`

加えて、このリポジトリは開発時に `*_DEV` の環境変数を優先できます。

```bash
# 開発（localhost）用
AUTH_GOOGLE_ID_DEV="..."
AUTH_GOOGLE_SECRET_DEV="..."

# 本番用（既存）
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

`AUTH_URL` は実際の実行 URL と一致させてください（開発なら通常 `http://localhost:3000`）。

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
