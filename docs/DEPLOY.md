# 本番デプロイ手順（identfill.com/jugyobase）

Ubuntu 22.04 / 24.04 LTS の VPS 1 台に、以下をすべて同居させる構成を前提とした手順です。

```
identfill.com (HTTPS, 443) ──▶ Nginx ──▶ 127.0.0.1:3001  Next.js (systemd)
                                        │
                                        ├─▶ 127.0.0.1:5432  PostgreSQL (docker)
                                        │
s3.identfill.com (HTTPS, 443) ──▶ Nginx ──▶ 127.0.0.1:9000  MinIO (docker)
```

- アプリは `/jugyobase` サブパス配信（`https://identfill.com/jugyobase/...`）
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

# Node.js 22 LTS（NodeSource）。Next.js 16 は Node 20+ が必要
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
| `DATABASE_URL`             | パスワード部分を上と一致させる                               |
| `AUTH_SECRET`              | 手順 0 で生成した値                                          |
| `AUTH_GOOGLE_ID`           | Google Cloud Console のクライアント ID                       |
| `AUTH_GOOGLE_SECRET`       | 同シークレット                                               |
| `MINIO_ROOT_USER`          | 任意。例: `jugyobase`                                        |
| `MINIO_ROOT_PASSWORD`      | 手順 0 で生成した値                                          |
| `S3_ACCESS_KEY_ID`         | 手順 5-4 で発行するサービスアカウントの値（最初は空でも可）  |
| `S3_SECRET_ACCESS_KEY`     | 同上                                                         |

`AUTH_URL` は **オリジンのみ**（`/jugyobase` を付けない）。`MINIO_SERVER_URL` と `S3_ENDPOINT` は **同じ値**（`https://s3.identfill.com`）にしておく。

---

## 4. PostgreSQL と MinIO を起動

```bash
# jugyobase ユーザ・/opt/jugyobase で実行
docker compose -f deploy/docker-compose.prod.yml --env-file .env.production up -d
docker compose -f deploy/docker-compose.prod.yml ps
```

両方 `healthy` になることを確認する。

> 公開ポートはどちらも `127.0.0.1:` バインドなので外部からは到達できない。アプリと Nginx だけが localhost 経由で叩く。

---

## 5. MinIO 側のバケット・アクセスキー作成

ブラウザから直接コンソールは見えないので、`mc`（MinIO Client）コンテナで初期セットアップする。

```bash
# まだ Nginx を立てる前なので、ローカルの 9000 に直接叩く
docker run --rm --network host \
  -e MC_HOST_local=http://${MINIO_ROOT_USER}:${MINIO_ROOT_PASSWORD}@127.0.0.1:9000 \
  --env-file .env.production \
  minio/mc \
  sh -c '
    mc mb -p local/$S3_BUCKET &&
    mc admin user svcacct add local $MINIO_ROOT_USER \
      --access-key jugyobase-app \
      --secret-key '"$(openssl rand -base64 24 | tr -d /=+ | cut -c1-40)"' \
      --name "jugyobase application key"
  '
```

上で表示されたアクセスキー / シークレットを `.env.production` の `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` に書き戻す。

> ルートユーザ（`MINIO_ROOT_USER`）の鍵をそのままアプリに渡してもいいが、運用上はサービスアカウントを発行して鍵交換できるようにしておくのが安全。

---

## 6. Next.js のビルドと systemd 登録

```bash
# まだ jugyobase ユーザのまま、/opt/jugyobase で
# NODE_ENV=production が残っていると devDependencies が省略されて next build が失敗する
unset NODE_ENV
npm ci --include=dev      # devDependencies も含めて入れる（next build に必要）
npm run db:migrate        # prisma migrate deploy
npm run build
```

> `prisma generate` は `postinstall` で自動実行される。

systemd ユニットを設置（ここから `root` 作業に戻る）。

```bash
# 別ターミナルで root に戻る、もしくは `exit` してから
exit                       # jugyobase ユーザを抜ける
install -m 644 /opt/jugyobase/deploy/systemd/jugyobase.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now jugyobase
systemctl status jugyobase --no-pager
journalctl -u jugyobase -e --no-pager   # ▶ Ready in ... と出れば OK
```

`curl -I http://127.0.0.1:3001/jugyobase/` で 200 か 302 が返れば、アプリは起動している。

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

この時点ではまだ HTTPS 証明書が無いので、443 のリスナーはエラーになる。先に HTTP 側だけ有効にして certbot を走らせる手もあるが、`certbot --nginx` は不足を自動で補ってくれるのでそのまま実行する。

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
# npx tsx scripts/create-tenant-user.ts --slug demo --name "デモ小学校" --email you@school.jp --domain school.jp
```

詳細は [`docs/TENANT_BOOTSTRAP.md`](TENANT_BOOTSTRAP.md)。

---

## 9. 動作確認

ブラウザで順番に。

1. `https://identfill.com/` → `/jugyobase/` にリダイレクトされ、テナント選択画面が出る
2. `https://identfill.com/jugyobase/t/demo/login` で Google ログイン → 投稿一覧に着地する
3. 投稿を作成 → 添付ファイル PUT が `https://s3.identfill.com/jugyobase/...` に飛び、ステータス 200 で完了する
4. 一覧から添付をダウンロード → 署名 URL（`s3.identfill.com`）にリダイレクトされ取得できる

`redirect_uri_mismatch` が出た場合は Google Cloud Console のリダイレクト URI 設定を再確認（README のトラブルシュート節も参照）。

---

## 10. 運用：更新・ログ・バックアップ

### 更新（コードを差し替える）

```bash
sudo -iu jugyobase
cd /opt/jugyobase
git pull
unset NODE_ENV
npm ci --include=dev
npm run db:migrate       # マイグレーション差分があるとき
npm run build
exit
systemctl restart jugyobase
```

### ログ

| 対象             | コマンド                                                     |
|------------------|--------------------------------------------------------------|
| Next.js          | `journalctl -u jugyobase -f`                                  |
| Nginx            | `tail -f /var/log/nginx/{access,error}.log`                   |
| Postgres / MinIO | `docker compose -f /opt/jugyobase/deploy/docker-compose.prod.yml logs -f` |

### バックアップ（最低限）

```bash
# DB ダンプ（毎日 cron で /var/backups/jugyobase に保存する例）
docker exec -t $(docker compose -f /opt/jugyobase/deploy/docker-compose.prod.yml ps -q postgres) \
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
| 添付 PUT が CORS で失敗                              | `s3.identfill.com` の Nginx 設定で `Access-Control-Allow-Origin` が `https://identfill.com` になっているか・OPTIONS が 204 を返すか確認。 |
| MinIO の署名検証エラー（`SignatureDoesNotMatch`）   | `MINIO_SERVER_URL` と `S3_ENDPOINT` が同じ値・かつ Nginx が `Host` を書き換えていないことを確認。`.env.production` 変更後は compose の `up -d` で MinIO を再起動。 |
| Server Action で 500 / 大きいフォーム送信が落ちる    | `identfill.conf` の `client_max_body_size` を調整。`proxy_read_timeout` も。                                                            |
| `prisma migrate deploy` が `permission denied`     | `DATABASE_URL` のパスワードや `POSTGRES_USER` が compose 側と一致しているか確認。                                                       |
