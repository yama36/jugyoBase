/** 学年・教科に依存しない共通項目用のラベル */
export const COMMON_GRADE_SUBJECT_LABEL = "共通" as const;

/** 中学校の教科・学年選択肢（プロフィール編集・投稿フォームで共通） */
export const GRADE_OPTIONS = [
  "1年",
  "2年",
  "3年",
  COMMON_GRADE_SUBJECT_LABEL,
] as const;

export const SUBJECT_OPTIONS = [
  "国語",
  "社会",
  "数学",
  "理科",
  "音楽",
  "美術",
  "保健体育",
  "技術",
  "家庭",
  "英語",
  "道徳",
  "学活",
  "総合",
  COMMON_GRADE_SUBJECT_LABEL,
] as const;

/** 学年または教科に「共通」が選ばれているか */
export function isCommonGradeOrSubjectSelection(
  grade: string,
  subject: string,
): boolean {
  return (
    grade === COMMON_GRADE_SUBJECT_LABEL ||
    subject === COMMON_GRADE_SUBJECT_LABEL
  );
}

/** 単元マスタが投稿フォームの学年・教科選択と一致するか（「共通」はワイルドカード） */
export function curriculumUnitMatchesSelection(
  selectedGrade: string,
  selectedSubject: string,
  unit: { grade: string; subject: string },
): boolean {
  if (!selectedGrade || !selectedSubject) return false;
  const gradeOk =
    unit.grade === selectedGrade || unit.grade === COMMON_GRADE_SUBJECT_LABEL;
  const subjectOk =
    unit.subject === selectedSubject ||
    unit.subject === COMMON_GRADE_SUBJECT_LABEL;
  return gradeOk && subjectOk;
}
