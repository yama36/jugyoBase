"use client";

import { useState, useTransition } from "react";
import { toggleTried } from "@/app/actions/tried";

export function TriedButton({
  tenantSlug,
  postId,
  initialTried,
  initialCount,
  canTry,
}: {
  tenantSlug: string;
  postId: string;
  initialTried: boolean;
  initialCount: number;
  canTry: boolean;
}) {
  const [tried, setTried] = useState(initialTried);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleTried(tenantSlug, postId);
      if (result.ok) {
        setTried(result.tried);
        setCount((prev) => (result.tried ? prev + 1 : prev - 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canTry || isPending}
      title={
        canTry
          ? "この授業実践をクラスで試した"
          : "閲覧専用アカウントは試したを押せません"
      }
      className={[
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
        tried
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
        !canTry || isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>試した</span>
      <span>{count}</span>
    </button>
  );
}
