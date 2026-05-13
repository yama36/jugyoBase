-- 誤生成マイグレーション 20260513014942 で落ちた検索インデックスと配列 DEFAULT を戻す
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Post_searchText_trgm_idx" ON "Post" USING gin ("searchText" gin_trgm_ops);
ALTER TABLE "CurriculumUnit" ALTER COLUMN "aliases" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ALTER COLUMN "subjects" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "User" ALTER COLUMN "grades" SET DEFAULT ARRAY[]::TEXT[];
