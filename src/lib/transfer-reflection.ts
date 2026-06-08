/** 力の身につけた場面（複数選択肢・中立な並び） */
export const TRANSFER_SKILL_ORIGIN_OPTIONS = [
  "校務",
  "授業準備",
  "授業本番",
  "私生活",
  "研修",
  "その他",
] as const;

export type TransferSkillOrigin = (typeof TRANSFER_SKILL_ORIGIN_OPTIONS)[number];

const ORIGIN_SET = new Set<string>(TRANSFER_SKILL_ORIGIN_OPTIONS);

export function parseTransferSkillOrigins(raw: FormDataEntryValue[]): TransferSkillOrigin[] {
  const seen = new Set<TransferSkillOrigin>();
  for (const item of raw) {
    const v = String(item).trim();
    if (ORIGIN_SET.has(v)) {
      seen.add(v as TransferSkillOrigin);
    }
  }
  return Array.from(seen);
}

export function isAiIctLessonChecked(raw: unknown): boolean {
  return raw === "on" || raw === "true";
}
