import { PostListPerPageSelect } from "@/components/PostListPerPageSelect";
import type { PostListFilterParams, PostListPerPage } from "@/lib/post-list-pagination";

type PostListToolbarProps = {
  tenantSlug: string;
  filters: PostListFilterParams;
  per: PostListPerPage;
  page: number;
  totalPages: number;
  totalCount: number;
};

export function PostListToolbar({
  tenantSlug,
  filters,
  per,
  page,
  totalPages,
  totalCount,
}: PostListToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <PostListPerPageSelect tenantSlug={tenantSlug} filters={filters} per={per} />
      <p className="text-sm text-zinc-600">
        全{totalCount.toLocaleString()}件 · {page} / {totalPages} ページ
      </p>
    </div>
  );
}
