import { COMMON_GRADE_SUBJECT_LABEL } from "@/lib/subject-grade-options";
import {
  AI_ICT_CATEGORY,
  categoryDisplayLabel,
  isLessonCategory,
  LESSON_CATEGORY,
  normalizePostCategory,
} from "@/lib/post-category";

export {
  AI_ICT_CATEGORY,
  categoryDisplayLabel,
  getPostSectionLabels,
  isAiIctCategory,
  isLessonCategory,
  LESSON_CATEGORY,
  LEGACY_BUSINESS_IMPROVEMENT_CATEGORY,
  normalizePostCategory,
  normalizePostSubject,
  POST_CATEGORIES,
  subjectRequiredForCategory,
  subjectSelectOptions,
} from "@/lib/post-category";

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

export function aiIctPostsFilterHref(
  tenantSlug: string,
  params: { subject?: string; grade?: string },
): string {
  const query = new URLSearchParams({ category: AI_ICT_CATEGORY });
  if (params.subject) query.set("subject", params.subject);
  if (params.grade) query.set("grade", params.grade);
  return `/t/${tenantSlug}/posts?${query.toString()}`;
}
