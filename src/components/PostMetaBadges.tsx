import {
  getGradeBadgeClasses,
  getSubjectBadgeClasses,
  getUnitBadgeClasses,
  NEUTRAL_BADGE_CLASSES,
} from "@/lib/subject-grade-colors";
import { categoryDisplayLabel, isAiIctCategory } from "@/lib/lesson-post";
import { StatusChip } from "@/components/StatusChip";

type PostMetaBadgesProps = {
  category?: string | null;
  grade?: string | null;
  subject?: string | null;
  unit?: string | null;
  /** 単元マスタがある学年・教科の組み合わせか（未指定時は unit の有無で表示） */
  hasCurriculumUnitOptions?: boolean;
  size?: "sm" | "md";
};

export function PostMetaBadges({
  category,
  grade,
  subject,
  unit,
  hasCurriculumUnitOptions,
  size = "sm",
}: PostMetaBadgesProps) {
  const gradeText = grade?.trim() ?? "";
  const subjectText = subject?.trim() ?? "";
  const unitText = unit?.trim() ?? "";
  const showUnit =
    hasCurriculumUnitOptions === true
      ? true
      : hasCurriculumUnitOptions === false
        ? false
        : Boolean(unitText);

  const gradeColor = getGradeBadgeClasses(gradeText);
  const subjectColor = getSubjectBadgeClasses(subjectText);
  const unitColor = getUnitBadgeClasses(subjectText);
  const categoryColor = NEUTRAL_BADGE_CLASSES;
  const padding = size === "md" ? "px-2.5 py-1" : "px-2 py-0.5";
  const aiIct = isAiIctCategory(category);

  return (
    <>
      {aiIct ? (
        <StatusChip tone="special" icon="🤖" className={size === "md" ? "px-2.5 py-1" : ""}>
          {categoryDisplayLabel(category)}
        </StatusChip>
      ) : (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full text-xs ${padding} ${categoryColor.wrapper}`}
        >
          <span className={categoryColor.label}>カテゴリ</span>
          <span className={categoryColor.value}>{categoryDisplayLabel(category)}</span>
        </span>
      )}
      {gradeText ? (
        <span
          className={`inline-flex items-center rounded-full text-xs ${padding} ${gradeColor.wrapper}`}
        >
          <span className={gradeColor.value}>{gradeText}</span>
        </span>
      ) : null}
      {subjectText ? (
        <span
          className={`inline-flex items-center rounded-full text-xs ${padding} ${subjectColor.wrapper}`}
        >
          <span className={subjectColor.value}>{subjectText}</span>
        </span>
      ) : null}
      {showUnit ? (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full text-xs ${padding} ${unitColor.wrapper}`}
        >
          <span className={unitColor.label}>単元</span>
          <span className={unitColor.value}>{unitText}</span>
        </span>
      ) : null}
    </>
  );
}
