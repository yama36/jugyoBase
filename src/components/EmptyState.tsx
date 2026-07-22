import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  /** 状態を表す絵文字/記号（既定は書類）。 */
  icon?: ReactNode;
  title: string;
  /** 補足。ここは「次の一手」を促す文言にする（ui-design ルール#6）。 */
  description?: string;
  /** 主要アクション（1つだけ）。権限が無いときは省略する。 */
  action?: { href: string; label: string };
};

/**
 * 空状態。「まだ何もない」で終わらせず、次の一手を促す。
 * 主要アクションは1画面1つ（ui-design）。
 */
export function EmptyState({
  icon = "📝",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
      <div aria-hidden className="text-2xl">
        {icon}
      </div>
      <p className="mt-2 text-sm font-medium text-text">{title}</p>
      {description ? (
        <p className="mt-1 text-xs text-text-sub">{description}</p>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
