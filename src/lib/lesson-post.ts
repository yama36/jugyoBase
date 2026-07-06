export const LESSON_CATEGORY = "授業" as const;

export function isLessonCategory(category: string | null | undefined): boolean {
  return (category ?? LESSON_CATEGORY) === LESSON_CATEGORY;
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
