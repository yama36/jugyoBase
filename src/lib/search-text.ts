/** 検索用に結合するフィールド（プランの「キーワード検索」対象） */
export function buildPostSearchText(parts: {
  title?: string | null;
  grade: string;
  subject: string;
  unit: string;
  contentItem?: string | null;
  aim: string;
  reflection?: string | null;
  point?: string | null;
  flow?: string | null;
  tagNames: string[];
}): string {
  const chunks = [
    parts.title,
    parts.grade,
    parts.subject,
    parts.unit,
    parts.contentItem,
    parts.aim,
    parts.reflection,
    parts.point,
    parts.flow,
    ...parts.tagNames,
  ]
    .filter(Boolean)
    .map((s) => String(s).trim());

  return chunks.join("\n");
}
