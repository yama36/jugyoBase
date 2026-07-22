# データモデル（MVP）

## ER 概要

```mermaid
erDiagram
  Tenant ||--o{ User : has
  Tenant ||--o{ Post : has
  Tenant ||--o{ Tag : has
  User ||--o{ Post : writes
  Post ||--o{ PostTag : tagged
  Tag ||--o{ PostTag : used
  Post ||--o{ Attachment : has
```

## テーブル

### `Tenant`

| 列        | 説明                          |
| --------- | ----------------------------- |
| id        | UUID                          |
| name      | 学校名                        |
| slug      | URL 用一意（例 `demo`）       |

### `User`（Auth.js / Google 連携）

| 列         | 説明                                      |
| ---------- | ----------------------------------------- |
| id         | cuid                                      |
| email      | **全体一意**（PrismaAdapter 要件）        |
| tenantId   | 所属テナント                              |
| tenantSlug | `Tenant.slug` のコピー（JWT 用・必須）    |

### `Post`（授業実践）

必須: `grade`, `subject`, `unit`, `aim`  
任意: `title`, `reflection`, `point`, `flow`, `referenceUrl`  
`category`: 授業 / 業務改善 / AI・ICT活用（デフォルト 授業）

**AI/ICT活用授業アンケート**（カテゴリ「授業」かつ `isAiIctLesson=true` のときのみ保存。公開投稿時は3項目必須。他教員には非公開）:

> **決定事項（2026-07-21）** — `isAiIctLesson` の**フラグ自体**は一覧・投稿詳細に「🤖 AI/ICT活用」バッジとして**表示する**（校内で「どの授業がAI/ICT活用か」を共有するため）。ただし振り返り3項目（`transferStrength` / `transferSkillOrigins` / `transferSkillOriginOther` / `transferMotivation`）の**回答本体は引き続き他教員に非公開**（投稿詳細・PDFに出さない。管理者CSVのみ）。フラグ表示はこの非公開方針を変更しない。

| 列 | 説明 |
| --- | --- |
| `isAiIctLesson` | AI/ICTを活用した授業としてアンケートに回答したか |
| `transferStrength` | 工夫できた・うまく使えたと感じる力 |
| `transferSkillOrigins` | 力を身につけた場面（複数可） |
| `transferSkillOriginOther` | 場面で「その他」を選んだときの補足 |
| `transferMotivation` | なぜこの授業でその力・AI活用を使おうと思ったか |

`searchText`: 検索用にアプリが結合更新するテキスト（`pg_trgm` GIN インデックス）。アンケート回答は `searchText` に含めない。

### `Tag` / `PostTag`

ハッシュタグは `Tag.name`（`#` なし・小文字）として `@@unique([tenantId, name])`。

### `Attachment`

`kind`: `pdf` | `slide` | `image` | `video`  
S3 互換ストレージの `storageKey` で参照。

## 全文・キーワード検索

- `searchText` にタイトル・学年・教科・単元・めあて・振り返り・POINT・流れ・タグ名を連結して保存。
- PostgreSQL `pg_trgm` + GIN で類似検索補助。
- アプリ側の一覧検索は Prisma の `contains`（`mode: insensitive`）を併用。

## マルチテナント隔離

- アプリ: `session.user.tenantId` / `tenantSlug` と URL の `tenantSlug` を照合。
- DB: `Post` / `Tag` / `PostTag` / `Attachment` に **RLS**（`set_config('jugyoBase.tenant_id', ...)` がセットされたトランザクション内でのみアクセス。`withTenantRls` を利用）。

## 権限（ロールなし）

- **編集・削除は投稿の作成者（`authorId`）のみ**。
