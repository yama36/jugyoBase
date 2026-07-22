"use client";

import type { MouseEvent } from "react";
import { PostListPerPageSelect } from "@/components/PostListPerPageSelect";
import type { PostListFilterParams, PostListPerPage } from "@/lib/post-list-pagination";

type PostListToolbarProps = {
  tenantSlug: string;
  filters: PostListFilterParams;
  per: PostListPerPage;
  page: number;
  totalPages: number;
  totalCount: number;
  /** summary 内に置くとき、details の開閉を奪わない */
  embedded?: boolean;
};

export function PostListToolbar({
  tenantSlug,
  filters,
  per,
  page,
  totalPages,
  totalCount,
  embedded = false,
}: PostListToolbarProps) {
  return (
    <div
      className={
        embedded
          ? "flex flex-wrap items-center gap-3"
          : "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3"
      }
      onClick={
        embedded
          ? (event: MouseEvent) => {
              event.preventDefault();
            }
          : undefined
      }
    >
      <PostListPerPageSelect tenantSlug={tenantSlug} filters={filters} per={per} />
      <p className="text-sm text-zinc-600">
        全{totalCount.toLocaleString()}件 · {page} / {totalPages} ページ
      </p>
    </div>
  );
}
