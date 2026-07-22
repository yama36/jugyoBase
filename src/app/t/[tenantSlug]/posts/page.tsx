import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { listPostSearchOptions, listPostsPage } from "@/lib/queries/posts";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import { isDemoTenantSlug } from "@/lib/demo-public";
import { pickPostThumbAttachment, postThumbKindLabel } from "@/lib/post-thumb";
import {
  parsePostListPage,
  parsePostListPerPage,
  type PostListFilterParams,
} from "@/lib/post-list-pagination";
import { PostListPagination } from "@/components/PostListPagination";
import { PostListThumbnail } from "@/components/PostListThumbnail";
import { PostListToolbar } from "@/components/PostListToolbar";
import { PostMetaBadges } from "@/components/PostMetaBadges";
import { SubjectSummaryMapLinkCard } from "@/components/SubjectSummaryMapLinkCard";
import { EmptyState } from "@/components/EmptyState";
import { StatusChip } from "@/components/StatusChip";

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tenantSlug } = await params;
  const sp = await searchParams;
  const session = await auth();
  const tenantId = await resolveViewTenantId(tenantSlug);
  if (!tenantId) {
    if (!isDemoTenantSlug(tenantSlug)) {
      redirect(`/t/${tenantSlug}/login`);
    }
    notFound();
  }

  const canCreatePost =
    session?.user?.tenantSlug === tenantSlug &&
    !!session.user.tenantId &&
    session.user.role !== "readonly";

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const grade = typeof sp.grade === "string" ? sp.grade : undefined;
  const subject = typeof sp.subject === "string" ? sp.subject : undefined;
  const unit = typeof sp.unit === "string" ? sp.unit : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const page = parsePostListPage(typeof sp.page === "string" ? sp.page : undefined);
  const per = parsePostListPerPage(typeof sp.per === "string" ? sp.per : undefined);

  const filters: PostListFilterParams = {
    q,
    grade,
    subject,
    unit,
    tag,
    category,
  };

  const [listResult, options] = await Promise.all([
    listPostsPage(tenantId, {
      ...filters,
      page,
      perPage: per,
    }),
    listPostSearchOptions(tenantId),
  ]);
  const { posts, totalCount, totalPages } = listResult;
  const currentPage = listResult.page;
  const hasSearchParams = Boolean(q || grade || subject || unit || tag || category);

  return (
    <div className="space-y-8">
      <div className="space-y-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-zinc-900">事例一覧</h1>
            <p className="mt-1 text-sm text-zinc-600">
              AIを特別なものにせず、日々の授業準備・実践で使い、校内で知見を共有していきましょう。
            </p>
          </div>
          {canCreatePost ? (
            <Link
              href={`/t/${tenantSlug}/posts/new`}
              className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              新規投稿
            </Link>
          ) : null}
        </div>
        <SubjectSummaryMapLinkCard tenantSlug={tenantSlug} />
      </div>

      <details
        open={hasSearchParams}
        className="group rounded-lg border border-zinc-200 bg-white"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
          <span className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-90"
            >
              <path
                fillRule="evenodd"
                d="M7.21 5.21a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 11-1.06-1.06L10.94 10 7.21 6.27a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
            検索条件
            {hasSearchParams ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                条件あり
              </span>
            ) : null}
          </span>
          <span className="text-xs text-zinc-500">
            <span className="group-open:hidden">開く</span>
            <span className="hidden group-open:inline">閉じる</span>
          </span>
        </summary>
        <form method="get" className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">キーワード</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="本文・タイトル・単元など"
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">学年</label>
            <select
              name="grade"
              defaultValue={grade ?? ""}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">指定なし</option>
              {options.grades.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">教科</label>
            <select
              name="subject"
              defaultValue={subject ?? ""}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">指定なし</option>
              {options.subjects.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">単元（部分一致）</label>
            <input
              name="unit"
              defaultValue={unit}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">タグ</label>
            <input
              name="tag"
              list="tag-suggestions"
              defaultValue={tag}
              placeholder="例: 協同学習"
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
            <datalist id="tag-suggestions">
              {options.tags.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">カテゴリ</label>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">指定なし</option>
              <option value="授業">授業</option>
              <option value="AI・ICT活用">AI / ICT活用(授業での活用含む)</option>
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            {per !== 30 ? <input type="hidden" name="per" value={per} /> : null}
            <button
              type="submit"
              className="rounded bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              検索
            </button>
            <Link
              href={`/t/${tenantSlug}/posts`}
              className="text-sm text-zinc-600 underline-offset-2 hover:underline"
            >
              条件クリア
            </Link>
          </div>
        </form>
      </details>

      {posts.length > 0 || totalCount > 0 ? (
        <PostListToolbar
          tenantSlug={tenantSlug}
          filters={filters}
          per={per}
          page={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
        />
      ) : null}

      <ul className="space-y-3">
        {posts.length === 0 ? (
          <li>
            {hasSearchParams ? (
              <EmptyState
                icon="🔎"
                title="条件に一致する投稿がありません"
                description="検索条件を変えるか、条件をクリアしてください。"
                action={{ href: `/t/${tenantSlug}/posts`, label: "条件をクリア" }}
              />
            ) : (
              <EmptyState
                title="まだ投稿がありません"
                description={
                  canCreatePost
                    ? "最初の授業・業務改善の事例を共有してみましょう。"
                    : "投稿が追加されるとここに表示されます。"
                }
                action={
                  canCreatePost
                    ? { href: `/t/${tenantSlug}/posts/new`, label: "新規投稿" }
                    : undefined
                }
              />
            )}
          </li>
        ) : (
          posts.map((post) => {
            const thumbAttachment = pickPostThumbAttachment(
              (post as { attachments?: Parameters<typeof pickPostThumbAttachment>[0] })
                .attachments,
            );

            return (
              <li key={post.id}>
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}`}
                  className="block rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-1)] transition hover:border-text-sub/40"
                >
                  <div className="flex gap-4">
                    {thumbAttachment ? (
                      <PostListThumbnail
                        tenantSlug={tenantSlug}
                        attachment={thumbAttachment}
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="font-medium text-text">
                          {post.title?.trim() || "（無題）"}
                        </h2>
                        <time
                          dateTime={post.createdAt.toISOString()}
                          className="text-xs text-text-sub"
                        >
                          {post.createdAt.toLocaleDateString("ja-JP")}
                        </time>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {post.isAiIctLesson ? (
                          <StatusChip tone="special" icon="🤖">
                            AI/ICT活用
                          </StatusChip>
                        ) : null}
                        <PostMetaBadges
                          category={post.category}
                          grade={post.grade}
                          subject={post.subject}
                          unit={post.unit}
                          hasCurriculumUnitOptions={
                            (post as { hasCurriculumUnitOptions?: boolean })
                              .hasCurriculumUnitOptions
                          }
                        />
                        {post.contentItem ? (
                          <span className="mt-1.5 block text-xs text-text-sub">
                            {post.contentItem}
                          </span>
                        ) : null}
                      </div>
                      {post.tags.length > 0 ? (
                        <p className="mt-2 text-xs text-primary">
                          {(post as unknown as { tags: { tag: { name: string } }[] }).tags
                            .map((pt) => `#${pt.tag.name}`)
                            .join(" ")}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-3 text-xs text-text-sub">
                        <span>♥ {post._count?.likes ?? 0}</span>
                        <span>試した {post._count?.tried ?? 0}</span>
                        <span>💬 {post._count?.comments ?? 0}</span>
                        {thumbAttachment ? (
                          <span className="text-text-sub">
                            添付: {postThumbKindLabel(thumbAttachment.kind)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>

      <PostListPagination
        tenantSlug={tenantSlug}
        filters={filters}
        per={per}
        page={currentPage}
        totalPages={totalPages}
      />
    </div>
  );
}
