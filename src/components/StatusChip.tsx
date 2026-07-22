import type { ReactNode } from "react";
import {
  STATUS_CHIP_CLASSES,
  STATUS_DEFAULT_ICON,
  type StatusTone,
} from "@/lib/status-styles";

type StatusChipProps = {
  /** 状態のトーン。通常メタ（教科・学年）ではなく「例外」の状態に使う。 */
  tone?: StatusTone;
  /** 既定アイコンを上書き（絵文字/記号）。null で非表示。 */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * インラインの状態チップ。教科バッジ（淡い bg-*-50）より強い塗り＋アイコンで際立たせる。
 * 「色＋アイコン＋ラベル」で白黒印刷でも意味が残る。
 */
export function StatusChip({
  tone = "info",
  icon,
  children,
  className = "",
}: StatusChipProps) {
  const glyph = icon === undefined ? STATUS_DEFAULT_ICON[tone] : icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CHIP_CLASSES[tone]} ${className}`}
    >
      {glyph !== null ? <span aria-hidden>{glyph}</span> : null}
      <span>{children}</span>
    </span>
  );
}
