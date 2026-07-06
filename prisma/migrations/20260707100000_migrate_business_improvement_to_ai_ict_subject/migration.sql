-- 業務改善カテゴリを AI・ICT活用 + 教科「業務改善」へ移行
UPDATE "Post"
SET
  category = 'AI・ICT活用',
  subject = '業務改善'
WHERE category = '業務改善';
