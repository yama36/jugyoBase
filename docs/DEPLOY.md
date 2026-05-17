# 本番デプロイ手順（identfill.com/jugyobase）

Ubuntu 22.04 / 24.04 LTS の VPS 1 台に、以下をすべて同居させる構成を前提とした手順です。

```
identfill.com (HTTPS, 443) ──▶ Nginx ──┬─▶ 127.0.0.1:3001  Next.js jugyoBase（Docker app→/jugyobase）
                                        │
                                        ├─▶ （任意）127.0.0.1:3101  /space（RSS 等・既存）
                                        │
                                        ├─▶ 127.0.0.1:5432  PostgreSQL (docker)
                                        │
s3.identfill.com (HTTPS, 443) ──▶ Nginx ──▶ 127.0.0.1:9000  MinIO (docker)
```

- アプリは `/jugyobase` サブパス配信（`https://identfill.com/jugyobase/...`）
- 同一ホストで **`https://identfill.com/space/...` に RSS 等を載せている場合**、Nginx で `/space` を jugyoBase のプロキシより先にルーティングする（手順 7 と [`deploy/nginx/identfill.conf`](../deploy/nginx/identfill.conf) のコメント例を参照）。リポジトリ同梱の `identfill.conf` だけをそのまま適用すると、`location /` が `404` のため **`/space` も 404 になる**点に注意する。
- 添付ファイルはブラウザから `https://s3.identfill.com` に直接 PUT/GET（署名 URL）
- リポジトリ同梱の設定ファイルは [`deploy/`](../deploy/) 配下。

> 別構成（Vercel / マネージド DB / Cloudflare R2 など）の場合は手順 5・7・8 をその構成向けに読み替えてください。

---

## 0. 事前準備（ローカルでの作業）

1. **本番用シークレットを 2 つ生成**してメモする。

   ```bash
   openssl rand -base64 32     # AUTH_SECRET 用
   openssl rand -base64 24     # POSTGRES_PASSWORD 用
   openssl rand -base64 24     # MINIO_ROOT_PASSWORD 用
   ```

2. **DNS** で以下 2 レコードを VPS の IP に向ける。
   - `identfill.com` → VPS の IPv4（`A` レコード）／IPv6 があれば `AAAA`
   - `s3.identfill.com` → 同じ VPS の IP（`A` レコード）

3. **Google Cloud Console** で OAuth クライアントに本番リダイレクト URI を追加する（開発用クライアントを使い回す前提）。
   - 認可済みのリダイレクト URI に **追加**：
     `https://identfill.com/jugyobase/api/auth/callback/google`
   - 認可済みの JavaScript 生成元に **追加**：`https://identfill.com`

4. ローカルで最新ブランチを GitHub に push しておく。

---

## 1. サーバの初期セットアップ

`root` で SSH ログインしている前提（VPS 提供事業者によって初期手順は異なる）。

```bash
# 必須パッケージ
apt update && apt upgrade -y
apt install -y curl ca-certificates gnupg lsb-release ufw git nginx

# Node.js 22 LTS（手順 8 の create-tenant-user 等をホストで npx するときに使用。アプリ本体は Docker 内でビルド）
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v   # v22.x になっていること
npm -v

# Docker Engine + Compose v2
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# certbot（Let's Encrypt）
apt install -y certbot python3-certbot-nginx
mkdir -p /var/www/letsencrypt

# ファイアウォール（22, 80, 443 だけ開ける）
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

### アプリ専用ユーザ

```bash
useradd --system --create-home --shell /bin/bash --home-dir /opt/jugyobase jugyobase
usermod -aG docker jugyobase
```

---

## 2. ソースの取得

```bash
sudo -iu jugyobase
cd /opt/jugyobase
git clone https://github.com/yama36/jugyoBase.git .
git checkout main
```

> `/opt/jugyobase` 自体を git のチェックアウト先にする想定。別パスを使う場合は systemd ユニットと Nginx の `WorkingDirectory` / `root` を合わせて書き換える。

---

## 3. 本番用 `.env.production` を作成

```bash
# jugyobase ユーザのまま
cp deploy/env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

最低限差し替える項目：

| 変数                       | 例 / 説明                                                   |
|----------------------------|--------------------------------------------------------------|
| `POSTGRES_PASSWORD`        | 手順 0 で生成した値                                          |
| `DATABASE_URL`             | 例のとおり `127.0.0.1:5432`（ホストからの `tsx` / ツール用） |
| `DATABASE_URL_DOCKER`      | `postgresql://jugyobase:（パスワード）@postgres:5432/jugyobase`。`POSTGRES_PASSWORD` に `/` `+` `@` 等がある場合は **URL エンコードしたパスワード**を入れる（`node -e 'console.log(encodeURIComponent(process.argv[1]))' '生パスワード'`） |
| `AUTH_SECRET`              | 手順 0 で生成した値                                          |
| `AUTH_GOOGLE_ID`           | Google Cloud Console のクライアント ID                       |
| `AUTH_GOOGLE_SECRET`       | 同シークレット                                               |
| `MINIO_ROOT_USER`          | 任意。例: `jugyobase`                                        |
| `MINIO_ROOT_PASSWORD`      | 手順 0 で生成した値                                          |
| `S3_ACCESS_KEY_ID`         | 手順 5-4 で発行するサービスアカウントの値（最初は空でも可）  |
| `S3_SECRET_ACCESS_KEY`     | 同上                                                         |

`AUTH_URL` は **オリジンのみ**（`/jugyobase` を付けない）。`MINIO_SERVER_URL` と `S3_ENDPOINT` は **同じ値**（`https://s3.identfill.com`）にしておく。ブラウザ直アップロード用に **`MINIO_API_CORS_ALLOW_ORIGIN=https://identfill.com`** を入れる（Nginx 側で CORS ヘッダを付けないこと）。

---

## 4. PostgreSQL と MinIO を起動

この段階では **`app`（Next.js）はまだ起動しない**（手順 6 でマイグレーションとビルド後に立ち上げる）。

```bash
# jugyobase ユーザ・/opt/jugyobase で実行
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production up -d postgres minio
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production ps
```

`postgres` と `minio` が `healthy` になることを確認する。

> 公開ポートはどちらも `127.0.0.1:` バインドなので外部からは到達できない。アプリと Nginx だけが localhost 経由で叩く。

---

## 5. MinIO 側のバケット・アクセスキー作成

ブラウザから直接コンソールは見えないので、`mc`（MinIO Client）コンテナで初期セットアップする。

```bash
# まだ Nginx を立てる前なので、ローカルの 9000 に直接叩く
# 注: minio/mc イメージは ENTRYPOINT が `mc` のため、`sh -c` を直渡しすると失敗する。
#     次のように `mc` をそのまま引数に渡す（または `--entrypoint /bin/sh` でシェル起動）。
set -a; source .env.production; set +a
SECRET="$(openssl rand -base64 24 | tr -d '/=+' | cut -c1-40)"

docker run --rm --network host \
  -e MC_HOST_local=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@127.0.0.1:9000 \
  --env-file .env.production \
  minio/mc mb -p "local/${S3_BUCKET}"

docker run --rm --network host \
  -e MC_HOST_local=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@127.0.0.1:9000 \
  --env-file .env.production \
  minio/mc admin user svcacct add local "${MINIO_ROOT_USER}" \
    --access-key jugyobase-app \
    --secret-key "${SECRET}" \
    --name "jugyobase application key"
```

`.env.production` を更新する: **`S3_ACCESS_KEY_ID=jugyobase-app`**（上記コマンドどおり）、**`S3_SECRET_ACCESS_KEY`** にはホストで生成した **`$SECRET`** と同じ値を入れる（ターミナルで `echo "$SECRET"` と打てば再表示できる。忘れた場合は `svcacct` を削除してから別の `SECRET` で作り直す）。

> ルートユーザ（`MINIO_ROOT_USER`）の鍵をそのままアプリに渡してもいいが、運用上はサービスアカウントを発行して鍵交換できるようにしておくのが安全。

---

## 6. Next.js イメージのビルドと systemd 登録（Docker）

アプリは **Docker イメージ**でビルドし、`deploy/docker-compose.prod.yml` の `app` サービスで起動する。ホストに Node で `npm run build` する方式は廃止した。

```bash
# jugyobase ユーザ・/opt/jugyobase で
# 初回または Dockerfile / 依存変更後にビルド
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production build app

# DB マイグレーション（コンテナ内で prisma migrate deploy）
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production run --rm app npx prisma migrate deploy

# Postgres / MinIO / app をまとめて起動（既に DB だけ起動している場合も up で揃う）
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production up -d
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production ps
```

`app` は compose 側で **`DATABASE_URL_DOCKER`**（`postgres` ホスト）を使う。ホストで `npx tsx scripts/...` を実行するときは `DATABASE_URL`（`127.0.0.1`）のままでよい。

systemd は **compose 全体の `up -d` / `stop`** を担当する（ここから `root` 作業）。

```bash
exit                       # jugyobase ユーザを抜ける
install -m 644 /opt/jugyobase/deploy/systemd/jugyobase.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now jugyobase
systemctl status jugyobase --no-pager
docker compose -f /opt/jugyobase/deploy/docker-compose.prod.yml --env-file /opt/jugyobase/.env.production ps
```

`curl -I http://127.0.0.1:3001/jugyobase` で 200 か 302（DB 未接続時は 500 でもルートは生きている）が返れば、アプリは起動している。コンテナ内で `curl -sSI http://127.0.0.1:3000/jugyobase/t/morinan/login` が **404 ではなく 200/302/500** なら basePath が効いている（404 のままなら `docker compose build app --no-cache` で standalone イメージを作り直す）。

---

## 7. Nginx と HTTPS

### 7-1. 設定ファイル配置

```bash
install -m 644 /opt/jugyobase/deploy/nginx/identfill.conf      /etc/nginx/sites-available/identfill.conf
install -m 644 /opt/jugyobase/deploy/nginx/s3.identfill.conf   /etc/nginx/sites-available/s3.identfill.conf
ln -sf /etc/nginx/sites-available/identfill.conf    /etc/nginx/sites-enabled/identfill.conf
ln -sf /etc/nginx/sites-available/s3.identfill.conf /etc/nginx/sites-enabled/s3.identfill.conf
# デフォルトサイトは外す
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

同梱の `identfill.conf` / `s3.identfill.conf` は **`listen 443 ssl http2` と Let's Encrypt の `ssl_certificate` 行を有効化した状態**です。`/etc/letsencrypt/live/...` に該当証明書が無いと **`nginx -t` が失敗**します。既に certbot 済みのサーバではこのまま `nginx -t` → `reload` でよいです。**まだ証明書が無い初回**は、手順 7-2 の `certbot --nginx` を実行してから再度 `nginx -t` する（`ssl_dhparam` が無いと言われたら `sudo certbot renew --dry-run` や certbot の案内に従い `ssl-dhparams.pem` を生成する）。

#### identfill.com の `/space`（RSS）と同居させる場合

本番で **`https://identfill.com/space`** で RSS を出している場合のチェックリストです。

1. リポジトリ同梱の [`deploy/nginx/identfill.conf`](../deploy/nginx/identfill.conf) には **`/space` → `127.0.0.1:3101` の `location` が含まれる**。別ポートの場合は `3101` を書き換える。
2. **`git pull` で上書きする**と手元で足した `/space` ブロックが消える可能性がある。運用では (a) リポジトリ側に `/space` 設定をコミットしておく、(b) もしくは `/etc/nginx/sites-available/identfill-local.conf` のような **include 用ファイル**に `/space` だけを書き、`identfill.conf` から `include` する、のどちらかにすると更新時の事故が減る。
3. **certbot の `-d` リスト**は従来どおり `identfill.com` で足りる。`/space` はパスなので追加の SAN は不要（別サブドメインで RSS を出しているなら、そのホスト名を DNS と certbot に含める）。
4. **jugyoBase の更新**（手順 10 の `sudo systemctl restart jugyobase`）は **`/space` の upstream には触れない**。RSS 側を別プロセスで動かしているなら、そのプロセスのデプロイ手順は別ドキュメントで管理する。
5. 動作確認: `curl -sSI https://identfill.com/space` および実際のフィード URL（例: `.../space/feed.xml`）で **200** と想定どおりの `Content-Type`（多くは `application/rss+xml` や `application/atom+xml`、または `text/xml`）が返ること。

### 7-2. Let's Encrypt 証明書

```bash
certbot --nginx \
  -d identfill.com -d www.identfill.com \
  -d s3.identfill.com \
  --redirect --agree-tos -m admin@identfill.com
```

`--redirect` で HTTP → HTTPS 強制を自動追加してくれる。再実行で `nginx -t && systemctl reload nginx` まで自動。

certbot のタイマーが有効か確認：

```bash
systemctl list-timers | grep certbot
```

---

## 8. テナント・初期ユーザの作成

DB が空のままだと誰もログインできないので、最低 1 校・1 ユーザを作る。

```bash
sudo -iu jugyobase
cd /opt/jugyobase
# .env.production の DATABASE_URL を読み込ませる
set -a; source .env.production; set +a

npx tsx scripts/create-tenant-user.ts \
  --slug demo \
  --name "デモ小学校" \
  --email you@example.com
# ドメイン制限を付ける場合
# npx tsx scripts/create-tenant-user.ts --slug morinan --name "守山南中学校" --email t1248103@ej-moriyama.ed.jp --domain ej-moriyama.ed.jp
```

詳細は [`docs/TENANT_BOOTSTRAP.md`](TENANT_BOOTSTRAP.md)。

---

## 9. 動作確認

ブラウザで順番に。

1. `https://identfill.com/` → `/jugyobase/` にリダイレクトされ、テナント選択画面が出る
2. `https://identfill.com/jugyobase/t/demo/login` で Google ログイン → 投稿一覧に着地する
3. 投稿を作成 → 添付ファイル PUT が `https://s3.identfill.com/jugyobase/...` に飛び、ステータス 200 で完了する
4. 一覧から添付をダウンロード → 署名 URL（`s3.identfill.com`）にリダイレクトされ取得できる
5. **`/space` を運用している場合**: フィード URLをブラウザまたは `curl` で開き、RSS が従来どおり取得できること（jugyoBase 更新直後にここだけ確認すると Nginx の取り違えに気づきやすい）

`redirect_uri_mismatch` が出た場合は Google Cloud Console のリダイレクト URI 設定を再確認（README のトラブルシュート節も参照）。

---

## 10. 運用：更新・ログ・バックアップ

### 更新（コードを差し替える）

```bash
sudo -iu jugyobase
cd /opt/jugyobase
git pull
# Nginx: identfill.conf をリポジトリから丸ごと install し直すと、
# 本番のみ存在する /space 用の location が消えることがある。差分を確認してから reload する。
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production build app
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production run --rm app npx prisma migrate deploy
exit
sudo systemctl restart jugyobase
# 上記は compose を stop してから up -d し直す。DB/MinIO も一度止まるが数秒で復帰する。
# RSS (/space) は別サービスなら、そのユニットも必要に応じて restart
```

マイグレーションが不要な更新だけなら、`run --rm app npx prisma migrate deploy` は省略してよい。

### ログ

| 対象             | コマンド                                                     |
|------------------|--------------------------------------------------------------|
| Next.js（app）   | `docker compose -f /opt/jugyobase/deploy/docker-compose.prod.yml --env-file /opt/jugyobase/.env.production logs -f app` |
| systemd（起動）  | `journalctl -u jugyobase -e --no-pager`                       |
| Nginx            | `tail -f /var/log/nginx/{access,error}.log`                   |
| Postgres / MinIO | `docker compose -f /opt/jugyobase/deploy/docker-compose.prod.yml --env-file /opt/jugyobase/.env.production logs -f postgres minio` |

### バックアップ（最低限）

```bash
# DB ダンプ（毎日 cron で /var/backups/jugyobase に保存する例）
# .env.production から POSTGRES_USER / POSTGRES_DB を読み込む想定
set -a; source /opt/jugyobase/.env.production; set +a
docker exec -t $(docker compose -f /opt/jugyobase/deploy/docker-compose.prod.yml --env-file /opt/jugyobase/.env.production ps -q postgres) \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > /var/backups/jugyobase/db-$(date +%F).sql.gz

# MinIO のオブジェクトは rclone や mc mirror で外部ストレージへ複製する
# 例: mc mirror local/jugyobase s3-backup/jugyobase
```

`.env.production`・Let's Encrypt の `/etc/letsencrypt/`・Docker ボリュームの実体（`/var/lib/docker/volumes/`）も忘れずに別マシンへ退避する。

---

## トラブルシュート

| 症状                                                | 対応                                                                                                                                  |
|-----------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| ログインで `redirect_uri_mismatch`                 | Google Cloud Console の URI に `https://identfill.com/jugyobase/api/auth/callback/google` が **完全一致** で入っているか確認。`AUTH_URL` に `/jugyobase` を含めない。 |
| 投稿一覧のページ遷移後にスタイル崩れ                  | Nginx の `proxy_pass` 末尾に `/` が付いていないか確認。付いていると `/jugyobase` が消えて `/_next/static/...` が 404 になる。           |
| 添付 PUT が CORS で失敗                              | **CORS は MinIO の `MINIO_API_CORS_ALLOW_ORIGIN` のみ**（`deploy/docker-compose.prod.yml`）。Nginx の `s3.identfill.conf` に `add_header Access-Control-*` を足さない。`contains multiple values 'https://identfill.com, https://identfill.com'` は Nginx と MinIO の二重付与。最新 `s3.identfill.conf` を配置して `nginx -t` → `reload` し、`.env.production` に `MINIO_API_CORS_ALLOW_ORIGIN=https://identfill.com` を入れて `docker compose ... up -d minio`。`curl -sI -H 'Origin: https://identfill.com' 'https://s3.identfill.com/jugyobase/' \| grep -i access-control-allow-origin` が **1 行**か確認。コミュニティ版 MinIO では `mc cors set` / `mc cors remove` は使えない。 |
| MinIO の署名検証エラー（`SignatureDoesNotMatch`）   | `MINIO_SERVER_URL` と `S3_ENDPOINT` が同じ値・かつ Nginx が `Host` を書き換えていないことを確認。`.env.production` 変更後は compose の `up -d` で MinIO を再起動。 |
| Server Action で 500 / 大きいフォーム送信が落ちる    | `identfill.conf` の `client_max_body_size` を調整。`proxy_read_timeout` も。                                                            |
| `prisma migrate deploy` が `permission denied`     | `DATABASE_URL` のパスワードや `POSTGRES_USER` が compose 側と一致しているか確認。                                                       |
| `docker compose` で app が起動しない（DB 接続エラー） | `.env.production` の **`DATABASE_URL_DOCKER`** のパスワードが URL エンコードされているか確認。 |
| `/jugyobase` が 404、`/t/...` だけ 500（コンテナ内 curl） | 古い Docker イメージで basePath が Linux 上で壊れていることがある。**standalone イメージ**（本リポジトリの `Dockerfile`）で `build --no-cache` し直す。 |
| `https://identfill.com/space/...` が **404**       | 同梱の `identfill.conf` では `location /` が `return 404` のため、`location ^~ /space/`（または静的 `alias`）を **`location /` より前**に追加したか確認。`nginx -t` 後に `systemctl reload nginx`。 |
