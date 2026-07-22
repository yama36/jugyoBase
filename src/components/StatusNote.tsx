import type { ReactNode } from "react";
import {
  STATUS_NOTE_CLASSES,
  STATUS_DEFAULT_ICON,
  type StatusTone,
} from "@/lib/status-styles";

type StatusNoteProps = {
  /** 状態のトーン。通常は使わず「例外」の告知にのみ用いる。 */
  tone?: StatusTone;
  /** 既定アイコンを上書きしたいとき（絵文字や記号）。null で非表示。 */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * 面で見せる状態告知（検査中・ダウンロード抑止・設定不足など）。
 * 「色＋アイコン＋ラベル」で、白黒印刷でも意味が残る。
 */
export function StatusNote({
  tone = "info",
  icon,
  children,
  className = "",
}: StatusNoteProps) {
  const glyph = icon === undefined ? STATUS_DEFAULT_ICON[tone] : icon;
  return (
    <div
      role="note"
      className={`flex gap-2 rounded-md px-3 py-2 text-xs leading-relaxed ${STATUS_NOTE_CLASSES[tone]} ${className}`}
    >
      {glyph !== null ? (
        <span aria-hidden className="mt-px shrink-0 font-semibold">
          {glyph}
        </span>
      ) : null}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
