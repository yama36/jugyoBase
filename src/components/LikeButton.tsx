"use client";

import { useState, useTransition } from "react";
import { toggleLike } from "@/app/actions/likes";

export function LikeButton({
  tenantSlug,
  postId,
  initialLiked,
  initialCount,
  canLike,
}: {
  tenantSlug: string;
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  canLike: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleLike(tenantSlug, postId);
      if (result.ok) {
        setLiked(result.liked);
        setCount((prev) => (result.liked ? prev + 1 : prev - 1));
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={!canLike || isPending}
      title={canLike ? undefined : "閲覧専用アカウントはいいねできません"}
      className={[
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
        liked
          ? "border-rose-300 bg-rose-50 text-rose-700"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
        (!canLike || isPending) ? "cursor-not-allowed opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
