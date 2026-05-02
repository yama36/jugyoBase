"use client";

import { useState, useTransition } from "react";
import { toggleBookmark } from "@/app/actions/bookmarks";

export function BookmarkButton({
  tenantSlug,
  postId,
  initialBookmarked,
}: {
  tenantSlug: string;
  postId: string;
  initialBookmarked: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleBookmark(tenantSlug, postId);
      if (result.ok) setBookmarked(result.bookmarked);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={bookmarked ? "ブックマーク解除" : "ブックマーク"}
      className={[
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
        bookmarked
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50",
        isPending ? "cursor-not-allowed opacity-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {bookmarked ? "★" : "☆"}
      <span>{bookmarked ? "保存済み" : "保存"}</span>
    </button>
  );
}
