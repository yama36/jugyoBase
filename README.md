# jugyoBase

学校単位のクローズドな「授業実践」共有（MVP）。Next.js・PostgreSQL・Google OAuth・S3 互換ストレージ。

## 機能

- 本番では Next.js の **`basePath` が `/jugyobase`**（例: `https://identfill.com/jugyobase/t/{slug}/posts`）。ローカルでも `http://localhost:3000/jugyobase` からアクセスします。
- テナント URL: `/t/{学校スラッグ}/…`（他校データは見えない）
- **URL の学校スラッグとログイン中ユーザの所属テナントは常に一致している必要がある**（`npm run dev` でも本番と同じ）。別校のスラッグを開いた場合は middleware が、所属校の同じパスへリダイレクトする。
- Google ログイン（**事前登録メール**のみ、任意で `hd` ドメイン制限）。ログインに使うメールは、対象テナントに紐づく `User` 行が既に DB に存在している必要がある（初回から自動作成はしない）。
- 投稿: 学年・教科・単元・めあて（必須）、振り返り・POINT・流れ・ハッシュタグ（任意）。閲覧専用ロール（`readonly`）は新規投稿不可。
- 検索: 学年・教科・単元・タグ・キーワード（`searchText` の部分一致）
- 事例一覧: ブラウザの再読み込みや画面遷移で最新表示（一定間隔の自動リフレッシュは行わない）。
- 添付: PDF / スライド / 画像 / 動画（署名付き URL で S3 互換へ直接アップロード）。任意でマルウェア検査 Webhook を設定すると、検査が終わるまでダウンロードを抑止できる（`.env.example` の `MALWARE_SCAN_WEBHOOK_SECRET`）。
- 投稿の編集・削除は **作成者**、または **管理者（`admin`）**。管理者向けに統計・ユーザー管理・校設定・指導要領単元マスタなどの画面がある。

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

**デモ用シード**（`npm run db:seed`）では、テナント `slug=demo` とユーザ `demo-teacher@example.com` が upsert される。デモ校で Google ログインする場合は、このメール（または `create-tenant-user` で登録したメール）を OAuth で使い、Google Console 側のテストユーザ等も忘れずに。

### 5. ファイルストレージ（MinIO 例）

`docker-compose.yml` の MinIO を起動したうえで:

```bash
S3_BUCKET=jugyobase
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minio
S3_SECRET_ACCESS_KEY=minio12345678
S3_ENDPOINT=http://127.0.0.1:9000
```

バケット `jugyobase`（**小文字のみ**。MinIO は大文字を含む名前を受け付けません）をコンソール（:9001）で作成するか、`docker exec jugyobase-minio-1 mc mb -p local/jugyobase` で作成してください。未設定でも投稿テキストは利用できます（添付のみ不可）。

### 6. 開発サーバー

```bash
npm run dev
```

ルート `http://localhost:3000/jugyobase` でテナントを選ぶか、`http://localhost:3000/jugyobase/t/{slug}/login` に直接アクセスしてログインします。

### Google OAuth の `redirect_uri_mismatch` 対策

アプリは **常に** `AUTH_GOOGLE_ID` と `AUTH_GOOGLE_SECRET`（互換で `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`）だけを参照する。環境ごとに別クライアントを使う場合は、Google Cloud Console で複数クライアントを作成し、`.env` を切り替える。

Google Cloud Console の OAuth 2.0 クライアントで、使うオリジンごとにリダイレクト URI を登録する。

- 開発: `http://localhost:3000/jugyobase/api/auth/callback/google`
- 本番（サブパス例）: `https://identfill.com/jugyobase/api/auth/callback/google`

`AUTH_URL` は**オリジン**（例: 開発 `http://localhost:3000`、本番 `https://identfill.com`）でよい。Auth.js のルートは `src/auth.ts` で `basePath` を `/jugyobase/api/auth` に固定している。`AUTH_URL` に `/jugyobase` だけ含めると誤解釈で `redirect_uri_mismatch` になる。

### 本番（サブパス配信・`identfill.com/jugyobase` の例）

- アプリの `basePath` は [`src/lib/app-base-path.ts`](src/lib/app-base-path.ts) と [`next.config.ts`](next.config.ts) で `/jugyobase` に固定しています。
- Nginx で別ポートの Node（例: `127.0.0.1:PORT`）へ渡すときは **`location ^~ /jugyobase/`** とし、**`proxy_pass` の URL に末尾 `/` を付けない**（付けると `/jugyobase` が削られてパスがずれることがあります）。ルート直下へ寄せる場合は `location = /jugyobase { return 301 /jugyobase/; }` など。
- 未ログイン時はトップ（`/jugyobase/`）で DB に登録されたテナント一覧から学校を選び、ログイン済みはそのテナントの投稿一覧へリダイレクトされます。

## ドキュメント

- [docs/DEPLOY.md](docs/DEPLOY.md) — 本番デプロイ手順（Ubuntu VPS + Nginx + Postgres + MinIO）
- [docs/TENANT_BOOTSTRAP.md](docs/TENANT_BOOTSTRAP.md) — 手動テナント作成
- [docs/DATA_MODEL.md](docs/DATA_MODEL.md) — スキーマと検索・RLS

## スクリプト

| コマンド            | 説明                 |
| ------------------- | -------------------- |
| `npm run db:migrate` | `migrate deploy`     |
| `npm run db:generate`| Prisma Client 生成   |
| `npm run db:seed`    | デモテナント・中学校単元マスタ・`demo-teacher@example.com`（任意） |
| `npm run tenant:create` | `tsx scripts/create-tenant-user.ts` の短縮 |
| `npm run build`      | 本番ビルド           |
