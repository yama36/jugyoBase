# jugyoBase 改善タスク引き継ぎ書(2026-07-06)

Claude Code による調査結果の引き継ぎ。実装エージェント(Cursor)は本書だけで作業できるよう自己完結で書いてある。
調査時点の HEAD は `ac2e901`、作業ツリーはクリーン。

## 前提と環境の注意

- **Next.js 16 / React 19 / Prisma 6 / next-auth v5 beta / Tailwind 4**。ルートの `AGENTS.md` の指示どおり、コードを書く前に `node_modules/next/dist/docs/` の該当ガイドを参照すること(学習データより新しい破壊的変更がある)。
- **⚠ node_modules が npm/pnpm 混在の壊れかけ状態**。調査中に `npm run lint` が pnpm の依存検証を誘発し、npm 由来パッケージが `node_modules/.ignored/` に移動、その後 build scripts 未承認で `pnpm install` が失敗した。**必ずタスク1を最初に完了させてから他タスクに着手する**こと。
- 検証済みの現状: `./node_modules/.bin/tsc --noEmit` は 0 エラー。テストは1本のみで実行失敗(タスク3参照)。eslint は未実行(実行不能)。
- コミットは1タスク1コミット。Conventional Commits(既存ログ参照: `feat(posts): …` / `fix(summary): …`)。

## タスク一覧(この順で実施)

### タスク1【高・規模S】pnpm への一本化と node_modules 復旧

**問題**: `package-lock.json` と `pnpm-lock.yaml` が両方コミットされ、README は npm を案内。`npm run` でも pnpm が起動して依存を組み替え、build scripts(prisma / sharp / esbuild)未承認で失敗する。

**作業**:
1. `package.json` に `"packageManager": "pnpm@11.1.1"` を追加(corepack キャッシュに存在するバージョン)。
2. `pnpm-workspace.yaml` に build scripts 許可を追加:
   ```yaml
   onlyBuiltDependencies:
     - "@prisma/client"
     - "@prisma/engines"
     - prisma
     - sharp
     - esbuild
     - unrs-resolver
   ```
3. `package-lock.json` を削除。
4. `rm -rf node_modules && pnpm install` で再生成(`.ignored` ごと消える)。
5. README.md・docs/DEPLOY.md・Dockerfile 内の `npm install` / `npm run` 表記を pnpm に統一。

**受け入れ条件**: `pnpm install` が exit 0 / `pnpm lint` が eslint 本体まで到達する / `./node_modules/.bin/tsc --noEmit` が 0 エラーのまま / `node_modules/.ignored` が存在しない。

### タスク2【最優先・セキュリティ・規模M】"use server" 読み取り系の認可欠落を修正

**問題**: `"use server"` ファイルの全 export はクライアントから直接呼べる POST エンドポイントになる。以下の読み取り系関数が `tenantId` / `userId` を**引数のまま信頼**しており、セッション検証がない。他テナントの統計・投稿・コメント、他ユーザの通知・ブックマークが漏れうる。

認可なしを確認済みの関数:

| 関数 | 場所 |
|---|---|
| `getStats(tenantId)` | `src/app/actions/stats.ts:6` |
| `listNotifications(userId)` / `getUnreadCount(userId)` | `src/app/actions/notifications.ts:7,18` |
| `listComments(tenantId, postId)` | `src/app/actions/comments.ts:7` |
| `listBookmarkedPosts(tenantId, userId)` / `getBookmarkStatus(postId, userId)` | `src/app/actions/bookmarks.ts:51,40` |
| `listPosts(tenantId, …)` / `listPostSearchOptions(tenantId)` / `getPost(tenantId, postId)` | `src/app/actions/posts.ts:316,394,461`(内部に検証があるか着手時に要精査) |

**方針**(どちらかを関数ごとに選ぶ。混在可):
- **A. server-only 化(推奨)**: サーバコンポーネントからしか呼ばれない読み取りヘルパーは、`"use server"` ファイルから `import "server-only"` を宣言した通常モジュール(例: `src/lib/queries/*.ts`)へ移動し、エンドポイント化自体を止める。呼び出し元の import パスを全て更新。
- **B. セッション由来に統一**: クライアントから呼ぶ必要がある関数は、冒頭で `const session = await auth()` を取り、`tenantId` / `userId` を**引数から削除**してセッション値を使う。引数シグネチャを残して比較するだけの実装は不可(呼び忘れが再発するため)。

**注意**:
- 書き込み系(`toggleLike` / `toggleBookmark` / `createComment` / `toggleTried` 等)は `auth()` 済みなので触らない。
- 添付ファイル系は `resolveAttachmentAccess` で認可済み。触らない。
- デモテナント(`src/lib/demo-public.ts` の `DEMO_TENANT_SLUG`)は未ログイン閲覧が仕様。デモの公開範囲を壊さないこと(middleware.ts:33 参照)。
- 呼び出し元(`src/app/t/[tenantSlug]/**/page.tsx` など)の引数変更の追従漏れが最大のリスク。`tsc --noEmit` で全呼び出し元のエラーが消えることを確認する。

**受け入れ条件**: 上記表の全関数が「server-only モジュール」または「セッション由来ID」のどちらかになっている / `grep -rn '"use server"' src/app/actions` の各ファイルで、export された関数が引数の tenantId・userId を DB クエリに直接使う箇所がゼロ / `tsc --noEmit` 0 エラー / 手動確認: 投稿一覧・投稿詳細・統計・通知・マイページ(ブックマーク)・コメント表示が dev サーバで動作。

### タスク3【中・規模S】テスト基盤の整備

**問題**: テストは `src/lib/hashtags.test.ts` の1本のみで、拡張子なし import(`./hashtags`)のため `node --experimental-strip-types --test` では `ERR_MODULE_NOT_FOUND` で失敗。`package.json` に `test` スクリプトもない。

**作業**:
1. vitest を devDependencies に追加し、`"test": "vitest run"` を定義(`@/` パスエイリアスを `vitest.config.ts` で解決)。
2. 既存の `hashtags.test.ts` を vitest で green にする。
3. 純粋ロジックのテストを追加: `src/lib/tenant-route-access.ts`(一致/不一致/null セッション)、`src/lib/search-text.ts`、`src/lib/csv.ts`。
4. タスク2のリグレッションテスト: 認可修正後の関数が「セッションなしで拒否/セッションのテナント外データを返さない」ことを、auth をモックしたユニットテストで固定する。

**受け入れ条件**: `pnpm test` が exit 0 / テストが最低 4 ファイル。

### タスク4【中・規模S】lint 復旧と警告掃除 + 最小CI

**作業**: タスク1完了後に `pnpm lint` を実行し、エラーを修正(警告は棚卸しして、機械的に直るものだけ直す)。`.github/workflows/ci.yml` を追加し、push 時に `pnpm install --frozen-lockfile` → `tsc --noEmit` → `pnpm lint` → `pnpm test` を回す。

**受け入れ条件**: `pnpm lint` exit 0 / CI ワークフローが lint・型・テストの3つを含む。

### タスク5【中・規模M】`src/app/actions/posts.ts`(1,296行)の分割

**問題**: 投稿CRUD・下書き(shell draft / autosave)・添付(presign / 登録 / 削除 / ストリーム)・アンケート処理が1ファイルに同居。

**作業**: `actions/posts.ts`(CRUD)/ `actions/drafts.ts` / `actions/attachments.ts` に分割。読み取り専用ヘルパーはタスク2の方針Aで `src/lib/queries/` へ。挙動変更は一切しない(純粋な移動とimport更新のみ)。タスク2と同時に進めると二度手間がない。

**受け入れ条件**: 各ファイル500行以下 / `tsc --noEmit` 0 エラー / `pnpm test` green / dev サーバで投稿の作成・編集・添付アップロード・削除が動作。

### タスク6【低・規模S–M】any 型の排除

`getPost(): Promise<any>`(posts.ts:461)を Prisma の `Prisma.PostGetPayload<…>` で型付けするのが本丸(投稿詳細画面全体が型チェック外)。`profile.ts:35` の `data: … as any` は schema とのずれの兆候なので原因を確認して除去。残り約21箇所は `grep -rn ": any\|as any" src` で棚卸しし、機械的に直るものを直す。

**受け入れ条件**: `as any` / `: any` が src 配下で 5 箇所以下(正当な残存はコメントで理由を明記)/ `tsc --noEmit` 0 エラー。

### タスク7【低・規模M・着手前に計測】サムネイルのサーバ側キャッシュ

`src/app/t/[tenantSlug]/files/[attachmentId]/route.ts` が `?thumb=1` のたびに S3 から原本取得 + sharp リサイズしている(`Cache-Control: private` なのでブラウザ毎に発生)。**本番で遅延が計測できた場合のみ**、初回生成時に派生サムネイルを S3 に保存する方式へ変更。計測せずに着手しない。

## 全体の完了確認

```bash
pnpm install          # exit 0
./node_modules/.bin/tsc --noEmit   # 0 エラー
pnpm lint             # exit 0
pnpm test             # exit 0
pnpm dev              # 投稿一覧・詳細・統計・通知・マイページを目視確認
```

セキュリティ(タスク2)の検証は「修正後の関数シグネチャに tenantId/userId 引数が残っていないこと」+ リグレッションテストで担保する。
