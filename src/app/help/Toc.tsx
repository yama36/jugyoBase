"use client";

import { useEffect, useState } from "react";

export type TocItem = {
  id: string;
  label: string;
};

/**
 * 右サイド追従型の目次。
 * - lg 以上で表示、それ未満は非表示（ページ上部のシンプルなインデックスでカバー）
 * - スクロール位置に応じて、現在見出しをハイライト
 */
export function Toc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0) return;

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;

    // ヘッダー高さを差し引いた位置に「見えている見出し」を判定するため、
    // rootMargin で上下を狭める。複数候補がある場合は最も上のものを採用。
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement);
        if (visible.length === 0) return;
        const top = visible.reduce((acc, el) =>
          el.offsetTop < acc.offsetTop ? el : acc,
        );
        setActiveId(top.id);
      },
      {
        rootMargin: "-96px 0px -60% 0px",
        threshold: 0,
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="目次" className="sticky top-6">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        Contents
      </p>
      <ul className="space-y-1.5 border-l border-zinc-200 text-sm">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`-ml-px block border-l-2 pl-3 py-1 transition-colors ${
                  isActive
                    ? "border-sky-600 font-medium text-sky-700"
                    : "border-transparent text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
