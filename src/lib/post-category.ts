import {
  AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT,
  subjectOptionsForCategory,
} from "@/lib/subject-grade-options";

export const LESSON_CATEGORY = "授業" as const;
export const AI_ICT_CATEGORY = "AI・ICT活用" as const;
/** 旧カテゴリ（DB移行後は残存しない想定） */
export const LEGACY_BUSINESS_IMPROVEMENT_CATEGORY = "業務改善" as const;

export const POST_CATEGORIES = [LESSON_CATEGORY, AI_ICT_CATEGORY] as const;

export type PostSectionLabels = {
  aim: string;
  reflection: string;
  point: string;
  flow: string;
};

export function normalizePostCategory(category: string | null | undefined): string {
  if (category === LEGACY_BUSINESS_IMPROVEMENT_CATEGORY) return AI_ICT_CATEGORY;
  return category ?? LESSON_CATEGORY;
}

export function normalizePostSubject(
  category: string | null | undefined,
  subject: string | null | undefined,
): string {
  if (category === LEGACY_BUSINESS_IMPROVEMENT_CATEGORY) {
    return AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT;
  }
  return subject?.trim() ?? "";
}

export function isLessonCategory(category: string | null | undefined): boolean {
  return normalizePostCategory(category) === LESSON_CATEGORY;
}

export function isAiIctCategory(category: string | null | undefined): boolean {
  return normalizePostCategory(category) === AI_ICT_CATEGORY;
}

export function isBusinessImprovementSubject(
  category: string | null | undefined,
  subject: string | null | undefined,
): boolean {
  if (category === LEGACY_BUSINESS_IMPROVEMENT_CATEGORY) return true;
  return (
    normalizePostCategory(category) === AI_ICT_CATEGORY &&
    normalizePostSubject(category, subject) === AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT
  );
}

/** カテゴリの表示ラベル（DB値は変えずに表示だけ差し替える） */
export function categoryDisplayLabel(category: string | null | undefined): string {
  if (
    category === AI_ICT_CATEGORY ||
    category === LEGACY_BUSINESS_IMPROVEMENT_CATEGORY
  ) {
    return "AI / ICT活用";
  }
  return category ?? LESSON_CATEGORY;
}

export function getPostSectionLabels(
  category: string | null | undefined,
  subject: string | null | undefined,
): PostSectionLabels {
  if (isBusinessImprovementSubject(category, subject)) {
    return {
      aim: "課題・背景",
      reflection: "効果・結果",
      point: "試みたこと（ツール名など）",
      flow: "気をつける点",
    };
  }
  if (isAiIctCategory(category)) {
    return {
      aim: "活用場面",
      reflection: "よかった点・気をつけた点",
      point: "使用したAI・ツール名",
      flow: "実践方法(使用したプロンプトなど)",
    };
  }
  return {
    aim: "めあて",
    reflection: "振り返り",
    point: "工夫した点（POINT）",
    flow: "簡単な授業の流れ",
  };
}

export function subjectRequiredForCategory(category: string): boolean {
  return category === LESSON_CATEGORY || category === AI_ICT_CATEGORY;
}

export function subjectSelectOptions(category: string): string[] {
  return subjectOptionsForCategory(category);
}
