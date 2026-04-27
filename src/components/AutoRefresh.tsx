"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  intervalMs?: number;
};

export function AutoRefresh({ intervalMs = 10000 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [intervalMs, router]);

  return (
    <p className="text-xs text-zinc-500">
      このページは自動更新中です（約{Math.round(intervalMs / 1000)}秒ごと）
    </p>
  );
}
