import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPost } from "@/app/actions/posts";
import { listComments } from "@/app/actions/comments";
import { getPostLikeInfo } from "@/app/actions/likes";
import { getBookmarkStatus } from "@/app/actions/bookmarks";
import { DeletePostButton } from "@/components/DeletePostButton";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CommentSection } from "@/components/CommentSection";
import { isS3Configured } from "@/lib/storage";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import {
  getGradeBadgeClasses,
  getSubjectBadgeClasses,
  getUnitBadgeClasses,
} from "@/lib/subject-grade-colors";

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tenantSlug, postId } = await params;
  const sp = await searchParams;
  const session = await auth();
  const tenantId = await resolveViewTenantId(tenantSlug);
  if (!tenantId) notFound();

  // 戻り先は ?from=mypage で明示。未指定時は一覧へフォールバック。
  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const backToMypage = fromParam === "mypage";
  const backHref = backToMypage
    ? `/t/${tenantSlug}/mypage`
    : `/t/${tenantSlug}/posts`;

  const userId = session?.user?.id ?? null;
  const [post, comments, likeInfo, bookmarked] = await Promise.all([
    getPost(tenantId, postId),
    listComments(tenantId, postId),
    getPostLikeInfo(tenantId, postId, userId),
    getBookmarkStatus(postId, userId),
  ]);
  if (!post) notFound();

  const sameTenantAsViewer =
    !!session?.user?.tenantId && session.user.tenantId === tenantId;
  const canEdit =
    sameTenantAsViewer &&
    (post.authorId === session.user.id || session.user.role === "admin");
  const canLike = sameTenantAsViewer && session.user.role !== "readonly";
  const canBookmark = sameTenantAsViewer;

  const gradeColor = getGradeBadgeClasses(post.grade);
  const subjectColor = getSubjectBadgeClasses(post.subject);
  const unitColor = getUnitBadgeClasses(post.subject);
  const contentSections = [
    { key: "aim", title: "めあて", value: post.aim },
    { key: "reflection", title: "振り返り", value: post.reflection },
    { key: "flow", title: "授業の流れ", value: post.flow },
    { key: "point", title: "工夫した点", value: post.point },
  ].filter((section) => section.value && section.value.trim().length > 0);

  const backTopLabel = backToMypage ? "マイページ" : "事例一覧";
  const titleText = post.title?.trim() || "（無題）";
  const hasMobileActions = canLike || canBookmark || canEdit;

  return (
    <article className="space-y-6 pb-24 sm:pb-0">
      <nav
        aria-label="breadcrumb"
        className="flex items-center justify-between gap-3 text-xs text-zinc-500"
      >
        <ol className="flex min-w-0 flex-wrap items-center gap-1.5">
          <li>
            <Link
              href={backHref}
              className="rounded hover:text-zinc-800 hover:underline"
            >
              {backTopLabel}
            </Link>
          </li>
          <li aria-hidden="true" className="text-zinc-300">
            /
          </li>
          <li
            aria-current="page"
            className="max-w-[60ch] truncate text-zinc-700"
          >
            {titleText}
          </li>
        </ol>
        <time
          dateTime={post.createdAt.toISOString()}
          className="shrink-0"
        >
          {post.createdAt.toLocaleDateString("ja-JP")}
        </time>
      </nav>

      {/* PC: 上部のアクションバー */}
      <div className="hidden flex-wrap items-center justify-end gap-2 py-1 sm:flex">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <LikeButton
            tenantSlug={tenantSlug}
            postId={postId}
            initialLiked={likeInfo.liked}
            initialCount={likeInfo.count}
            canLike={canLike}
          />
          <BookmarkButton
            tenantSlug={tenantSlug}
            postId={postId}
            initialBookmarked={bookmarked}
            disabled={!canBookmark}
          />
          <Link
            href={`/t/${tenantSlug}/posts/${postId}/print`}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            title="印刷・PDF保存"
          >
            PDF保存
          </Link>
          {canEdit ? (
            <>
              <Link
                href={`/t/${tenantSlug}/posts/${postId}/edit?from=detail`}
                className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
              >
                編集
              </Link>
              <DeletePostButton tenantSlug={tenantSlug} postId={postId} />
            </>
          ) : null}
        </div>
      </div>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {titleText}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${gradeColor.wrapper}`}
          >
            <span className={gradeColor.value}>{post.grade}</span>
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${subjectColor.wrapper}`}
          >
            <span className={subjectColor.value}>{post.subject}</span>
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${unitColor.wrapper}`}
          >
            <span className={unitColor.label}>単元</span>
            <span className={unitColor.value}>{post.unit}</span>
          </span>
          {post.contentItem ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs">
              <span className="text-zinc-500">内容項目</span>
              <span className="font-medium text-zinc-800">
                {post.contentItem}
              </span>
            </span>
          ) : null}
          {post.tags.length > 0 ? (
            <ul className="contents">
              {post.tags.map((pt) => (
                <li
                  key={pt.tag.id}
                  className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800"
                >
                  #{pt.tag.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      {/* 本文：1枚のカードにまとめ、セクション間は区切り線でつなぐ */}
      {contentSections.length > 0 ? (
        <section className="space-y-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
          {contentSections.map((section) => (
            <div key={section.key} className="space-y-2 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-1 rounded-full bg-zinc-400"
                />
                {section.title}
              </h2>
              <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-700">
                {section.value}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <span
            aria-hidden="true"
            className="inline-block h-4 w-1 rounded-full bg-zinc-400"
          />
          添付ファイル
        </h2>
        {!isS3Configured() ? (
          <p className="text-sm text-zinc-600">
            ファイルストレージが未設定のため、添付の閲覧はできません（環境変数を設定してください）。
          </p>
        ) : post.attachments.length === 0 ? (
          <p className="text-sm text-zinc-600">添付はありません</p>
        ) : (
          <ul className="space-y-2">
            {post.attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={`/t/${tenantSlug}/files/${a.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 text-sm transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                      {a.kind}
                    </span>
                    <span className="truncate text-sky-800">
                      {a.originalFilename}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {(a.sizeBytes / 1024).toFixed(1)} KiB
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CommentSection
        postId={postId}
        tenantSlug={tenantSlug}
        currentUserId={sameTenantAsViewer ? session!.user.id : null}
        currentUserRole={sameTenantAsViewer ? session!.user.role : null}
        initialComments={comments}
      />

      {/* スマホ: 下部固定のアクションバー */}
      {hasMobileActions ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-3xl items-center gap-2 overflow-x-auto">
            <LikeButton
              tenantSlug={tenantSlug}
              postId={postId}
              initialLiked={likeInfo.liked}
              initialCount={likeInfo.count}
              canLike={canLike}
            />
            <BookmarkButton
              tenantSlug={tenantSlug}
              postId={postId}
              initialBookmarked={bookmarked}
              disabled={!canBookmark}
            />
            <div className="ml-auto flex items-center gap-2">
              <Link
                href={`/t/${tenantSlug}/posts/${postId}/print`}
                className="shrink-0 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
                title="印刷・PDF保存"
              >
                PDF
              </Link>
              {canEdit ? (
                <>
                  <Link
                    href={`/t/${tenantSlug}/posts/${postId}/edit?from=detail`}
                    className="shrink-0 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
                  >
                    編集
                  </Link>
                  <DeletePostButton
                    tenantSlug={tenantSlug}
                    postId={postId}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
