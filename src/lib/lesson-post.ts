import { COMMON_GRADE_SUBJECT_LABEL } from "@/lib/subject-grade-options";

export const LESSON_CATEGORY = "授業" as const;

/** カテゴリのDB保存値（zod enum・DBと一致させること） */
export const POST_CATEGORIES = ["授業", "業務改善", "AI・ICT活用"] as const;

/** カテゴリの表示ラベル（DB値は変えずに表示だけ差し替える） */
export function categoryDisplayLabel(category: string | null | undefined): string {
  if (category === "AI・ICT活用") return "AI / ICT活用";
  return category ?? LESSON_CATEGORY;
}

export function isLessonCategory(category: string | null | undefined): boolean {
  return (category ?? LESSON_CATEGORY) === LESSON_CATEGORY;
}

/** 授業投稿の教科集計キー（空白除去・未設定は「共通」） */
export function normalizeLessonSubject(subject: string | null | undefined): string {
  const trimmed = subject?.trim() ?? "";
  return trimmed === "" ? COMMON_GRADE_SUBJECT_LABEL : trimmed;
}

export function lessonPostsFilterHref(
  tenantSlug: string,
  params: { subject?: string; grade?: string },
): string {
  const query = new URLSearchParams({ category: LESSON_CATEGORY });
  if (params.subject) query.set("subject", params.subject);
  if (params.grade) query.set("grade", params.grade);
  return `/t/${tenantSlug}/posts?${query.toString()}`;
}
