/**
 * 学年・教科バッジの配色定義。
 * Tailwind v4 のクラスは静的文字列でないと検出されないため、
 * 動的合成（例：`bg-${color}-50`）は禁止し、各クラスを文字列として明示的に保持する。
 */

type BadgeClasses = {
  /** バッジ全体（背景・枠線・基本文字色） */
  wrapper: string;
  /** ラベル部分（学年/教科 などの薄いテキスト） */
  label: string;
  /** 値部分（実際の学年・教科名などの濃いテキスト） */
  value: string;
};

const SUBJECT_BADGE: Record<string, BadgeClasses> = {
  国語: {
    wrapper: "bg-rose-50 border border-rose-200",
    label: "text-rose-700/80",
    value: "text-rose-900 font-medium",
  },
  社会: {
    wrapper: "bg-amber-50 border border-amber-200",
    label: "text-amber-700/80",
    value: "text-amber-900 font-medium",
  },
  数学: {
    wrapper: "bg-blue-50 border border-blue-200",
    label: "text-blue-700/80",
    value: "text-blue-900 font-medium",
  },
  理科: {
    wrapper: "bg-emerald-50 border border-emerald-200",
    label: "text-emerald-700/80",
    value: "text-emerald-900 font-medium",
  },
  音楽: {
    wrapper: "bg-pink-50 border border-pink-200",
    label: "text-pink-700/80",
    value: "text-pink-900 font-medium",
  },
  美術: {
    wrapper: "bg-orange-50 border border-orange-200",
    label: "text-orange-700/80",
    value: "text-orange-900 font-medium",
  },
  保健体育: {
    wrapper: "bg-red-50 border border-red-200",
    label: "text-red-700/80",
    value: "text-red-900 font-medium",
  },
  技術: {
    wrapper: "bg-lime-50 border border-lime-200",
    label: "text-lime-800/80",
    value: "text-lime-900 font-medium",
  },
  家庭: {
    wrapper: "bg-fuchsia-50 border border-fuchsia-200",
    label: "text-fuchsia-700/80",
    value: "text-fuchsia-900 font-medium",
  },
  英語: {
    wrapper: "bg-cyan-50 border border-cyan-200",
    label: "text-cyan-800/80",
    value: "text-cyan-900 font-medium",
  },
  道徳: {
    wrapper: "bg-purple-50 border border-purple-200",
    label: "text-purple-700/80",
    value: "text-purple-900 font-medium",
  },
  学活: {
    wrapper: "bg-slate-100 border border-slate-200",
    label: "text-slate-600",
    value: "text-slate-900 font-medium",
  },
  総合: {
    wrapper: "bg-teal-50 border border-teal-200",
    label: "text-teal-700/80",
    value: "text-teal-900 font-medium",
  },
};

const NEUTRAL_BADGE: BadgeClasses = {
  wrapper: "bg-zinc-100 border border-zinc-200",
  label: "text-zinc-500",
  value: "text-zinc-800 font-medium",
};

export function getGradeBadgeClasses(_grade: string): BadgeClasses {
  return NEUTRAL_BADGE;
}

export function getSubjectBadgeClasses(subject: string): BadgeClasses {
  return SUBJECT_BADGE[subject] ?? NEUTRAL_BADGE;
}

/** 単元は教科に色を揃える */
export function getUnitBadgeClasses(subject: string): BadgeClasses {
  return getSubjectBadgeClasses(subject);
}

export const NEUTRAL_BADGE_CLASSES: BadgeClasses = NEUTRAL_BADGE;
