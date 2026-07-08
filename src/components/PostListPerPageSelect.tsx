"use client";

import { withBasePath } from "@/lib/app-base-path";
import {
  POST_LIST_PER_PAGE_OPTIONS,
  type PostListFilterParams,
  type PostListPerPage,
} from "@/lib/post-list-pagination";

type PostListPerPageSelectProps = {
  tenantSlug: string;
  filters: PostListFilterParams;
  per: PostListPerPage;
};

export function PostListPerPageSelect({
  tenantSlug,
  filters,
  per,
}: PostListPerPageSelectProps) {
  return (
    <form
      method="get"
      action={withBasePath(`/t/${tenantSlug}/posts`)}
      className="inline-flex"
    >
      {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
      {filters.grade ? <input type="hidden" name="grade" value={filters.grade} /> : null}
      {filters.subject ? (
        <input type="hidden" name="subject" value={filters.subject} />
      ) : null}
      {filters.unit ? <input type="hidden" name="unit" value={filters.unit} /> : null}
      {filters.tag ? <input type="hidden" name="tag" value={filters.tag} /> : null}
      {filters.category ? (
        <input type="hidden" name="category" value={filters.category} />
      ) : null}
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <span className="shrink-0">表示件数</span>
        <select
          name="per"
          defaultValue={String(per)}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-800"
        >
          {POST_LIST_PER_PAGE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}件
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
