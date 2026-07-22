/**
 * 状態（ステータス）表示の配色。ui-design 原則:
 *  - 通常＝無地。色は「例外」だけに乗せる（教科カラーの淡い bg-*-50 とは重量を変える）
 *  - 色だけに意味を持たせない → 必ず「色＋アイコン＋ラベル」の3点セットで使う
 *  - 白黒印刷/PDF でも意味が落ちないこと（アイコンとラベルが残る）
 *
 * globals.css の --st-* / --color-st-* トークンを参照する。
 * Tailwind v4 は静的文字列でないとクラスを検出しないため、動的合成せず全て明示。
 */

export type StatusTone = "info" | "ok" | "special" | "warn" | "none" | "danger";

/** 面で見せる通知（ブロック要素）。枠線＋淡い地＋濃い前景。 */
export const STATUS_NOTE_CLASSES: Record<StatusTone, string> = {
  info: "border border-st-info-fg/20 bg-st-info text-st-info-fg",
  ok: "border border-st-ok-fg/20 bg-st-ok text-st-ok-fg",
  special: "border border-st-special-fg/20 bg-st-special text-st-special-fg",
  warn: "border border-st-warn-fg/25 bg-st-warn text-st-warn-fg",
  none: "border border-st-none-fg/20 bg-st-none text-st-none-fg",
  danger: "border border-st-danger-fg/20 bg-st-danger text-st-danger-fg",
};

/** 小さく見せるチップ（インライン）。教科バッジより強い塗りで際立たせる。 */
export const STATUS_CHIP_CLASSES: Record<StatusTone, string> = {
  info: "bg-st-info text-st-info-fg",
  ok: "bg-st-ok text-st-ok-fg",
  special: "bg-st-special text-st-special-fg",
  warn: "bg-st-warn text-st-warn-fg",
  none: "bg-st-none text-st-none-fg",
  danger: "bg-st-danger text-st-danger-fg",
};

/** トーン既定のアイコン（白黒でも意味が残る記号）。呼び出し側で上書き可。 */
export const STATUS_DEFAULT_ICON: Record<StatusTone, string> = {
  info: "ℹ",
  ok: "✓",
  special: "★",
  warn: "⚠",
  none: "○",
  danger: "⚠",
};
