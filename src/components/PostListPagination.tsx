import Link from "next/link";
import {
  buildPostListHref,
  type PostListFilterParams,
  type PostListPerPage,
} from "@/lib/post-list-pagination";

type PostListPaginationProps = {
  tenantSlug: string;
  filters: PostListFilterParams;
  per: PostListPerPage;
  page: number;
  totalPages: number;
};

export function PostListPagination({
  tenantSlug,
  filters,
  per,
  page,
  totalPages,
}: PostListPaginationProps) {
  if (totalPages <= 1) return null;

  const prevHref =
    page > 1
      ? buildPostListHref(tenantSlug, { ...filters, page: page - 1, per })
      : null;
  const nextHref =
    page < totalPages
      ? buildPostListHref(tenantSlug, { ...filters, page: page + 1, per })
      : null;

  const linkClass =
    "rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50";
  const disabledClass =
    "rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-400";

  return (
    <nav
      aria-label="事例一覧のページ移動"
      className="flex items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3"
    >
      {prevHref ? (
        <Link href={prevHref} className={linkClass}>
          ← 前へ
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          ← 前へ
        </span>
      )}
      {nextHref ? (
        <Link href={nextHref} className={linkClass}>
          次へ →
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled="true">
          次へ →
        </span>
      )}
    </nav>
  );
}
