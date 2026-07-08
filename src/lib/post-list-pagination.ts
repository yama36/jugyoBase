export const POST_LIST_PER_PAGE_OPTIONS = [30, 50, 100] as const;

export type PostListPerPage = (typeof POST_LIST_PER_PAGE_OPTIONS)[number];

export const DEFAULT_POST_LIST_PER_PAGE: PostListPerPage = 30;

export type PostListFilterParams = {
  q?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  tag?: string;
  category?: string;
};

export type PostListQueryParams = PostListFilterParams & {
  page?: number;
  per?: number;
};

export function parsePostListPerPage(value: string | undefined): PostListPerPage {
  const n = Number(value);
  if (
    POST_LIST_PER_PAGE_OPTIONS.includes(n as PostListPerPage)
  ) {
    return n as PostListPerPage;
  }
  return DEFAULT_POST_LIST_PER_PAGE;
}

export function parsePostListPage(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function totalPostListPages(totalCount: number, perPage: number): number {
  if (totalCount <= 0) return 1;
  return Math.ceil(totalCount / perPage);
}

export function clampPostListPage(page: number, totalPages: number): number {
  if (totalPages < 1) return 1;
  return Math.min(Math.max(1, page), totalPages);
}

export function buildPostListQueryString(
  params: PostListQueryParams,
): string {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set("q", params.q.trim());
  if (params.grade) search.set("grade", params.grade);
  if (params.subject) search.set("subject", params.subject);
  if (params.unit?.trim()) search.set("unit", params.unit.trim());
  if (params.tag?.trim()) search.set("tag", params.tag.trim());
  if (params.category) search.set("category", params.category);
  const page = params.page ?? 1;
  const per = params.per ?? DEFAULT_POST_LIST_PER_PAGE;
  if (page > 1) search.set("page", String(page));
  if (per !== DEFAULT_POST_LIST_PER_PAGE) search.set("per", String(per));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function buildPostListHref(
  tenantSlug: string,
  params: PostListQueryParams,
): string {
  return `/t/${tenantSlug}/posts${buildPostListQueryString(params)}`;
}
