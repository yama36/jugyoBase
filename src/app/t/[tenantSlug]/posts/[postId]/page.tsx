import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPost } from "@/app/actions/posts";
import { listComments } from "@/app/actions/comments";
import { getPostLikeInfo } from "@/app/actions/likes";
import { getPostTriedInfo } from "@/app/actions/tried";
import { getBookmarkStatus } from "@/app/actions/bookmarks";
import { DeletePostButton } from "@/components/DeletePostButton";
import { LikeButton } from "@/components/LikeButton";
import { TriedButton } from "@/components/TriedButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { CommentSection } from "@/components/CommentSection";
import { isS3Configured } from "@/lib/storage";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import {
  getGradeBadgeClasses,
  NEUTRAL_BADGE_CLASSES,
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

  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const backToMypage = fromParam === "mypage";
  const backHref = backToMypage
    ? `/t/${tenantSlug}/mypage`
    : `/t/${tenantSlug}/posts`;

  const userId = session?.user?.id ?? null;
  const [post, comments, likeInfo, triedInfo, bookmarked] = await Promise.all([
    getPost(tenantId, postId),
    listComments(tenantId, postId),
    getPostLikeInfo(tenantId, postId, userId),
    getPostTriedInfo(tenantId, postId, userId),
    getBookmarkStatus(postId, userId),
  ]);
  if (!post) notFound();

  const sameTenantAsViewer =
    !!session?.user?.tenantId && session.user.tenantId === tenantId;
  const canEdit =
    sameTenantAsViewer &&
    (post.authorId === session.user.id || session.user.role === "admin");
  const canLike = sameTenantAsViewer && session.user.role !== "readonly";
  const canTry = canLike;
  const canBookmark = sameTenantAsViewer;

  const gradeColor = getGradeBadgeClasses(post.grade);
  const subjectColor = getSubjectBadgeClasses(post.subject);
  const unitColor = getUnitBadgeClasses(post.subject);
  const categoryColor = NEUTRAL_BADGE_CLASSES;
  const category = post.category ?? "授業";
  const sectionLabels =
    category === "業務改善"
      ? {
          aim: "課題・背景",
          reflection: "効果・結果",
          flow: "気をつける点",
          point: "試みたこと（ツール名など）",
        }
      : category === "AI・ICT活用"
        ? {
            aim: "活用場面",
            reflection: "よかった点・気をつけた点",
            flow: "使ったプロンプト例",
            point: "使用したAI・ツール名",
          }
        : {
            aim: "めあて",
            reflection: "振り返り",
            flow: "授業の流れ",
            point: "工夫した点",
          };
  const contentSections = [
    { key: "aim", title: sectionLabels.aim, value: post.aim },
    { key: "reflection", title: sectionLabels.reflection, value: post.reflection },
    { key: "flow", title: sectionLabels.flow, value: post.flow },
    { key: "point", title: sectionLabels.point, value: post.point },
  ].filter((section) => section.value && section.value.trim().length > 0);

  const backTopLabel = backToMypage ? "マイページ" : "一覧";
  const titleText = post.title?.trim() || "（無題）";
  const hasMobileActions = canLike || canTry || canBookmark || canEdit;
  const hasContent = contentSections.length > 0 || post.referenceUrl?.trim();

  return (
    <article className="space-y-6 pb-24 sm:pb-0">
      {/* 上部：一覧に戻るボタン + PC アクション */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          {backTopLabel}に戻る
        </Link>

        <div className="flex items-center gap-2">
          <time
            dateTime={post.createdAt.toISOString()}
            className="text-xs text-zinc-500"
          >
            {post.createdAt.toLocaleDateString("ja-JP")}
          </time>
          {/* PC のみ表示するアクション群 */}
          <div className="hidden items-center gap-2 sm:flex">
            <LikeButton
              tenantSlug={tenantSlug}
              postId={postId}
              initialLiked={likeInfo.liked}
              initialCount={likeInfo.count}
              canLike={canLike}
            />
            <TriedButton
              tenantSlug={tenantSlug}
              postId={postId}
              initialTried={triedInfo.tried}
              initialCount={triedInfo.count}
              canTry={canTry}
            />
            <BookmarkButton
              tenantSlug={tenantSlug}
              postId={postId}
              initialBookmarked={bookmarked}
              disabled={!canBookmark}
            />
            <Link
              href={`/t/${tenantSlug}/posts/${postId}/print`}
              className="cursor-pointer rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
              title="印刷・PDF保存"
            >
              PDF保存
            </Link>
            {canEdit ? (
              <>
                <Link
                  href={`/t/${tenantSlug}/posts/${postId}/edit?from=detail`}
                  className="cursor-pointer rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
                >
                  編集
                </Link>
                <DeletePostButton tenantSlug={tenantSlug} postId={postId} />
              </>
            ) : null}
          </div>
        </div>
      </div>

      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {titleText}
        </h1>
        <div className="flex flex-wrap items-center gap-1.5">
          {/* カテゴリバッジを先頭に */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${categoryColor.wrapper}`}
          >
            <span className={categoryColor.label}>カテゴリ</span>
            <span className={categoryColor.value}>{category}</span>
          </span>
          {post.grade ? (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${gradeColor.wrapper}`}
            >
              <span className={gradeColor.value}>{post.grade}</span>
            </span>
          ) : null}
          {post.subject ? (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${subjectColor.wrapper}`}
            >
              <span className={subjectColor.value}>{post.subject}</span>
            </span>
          ) : null}
          {post.hasCurriculumUnitOptions ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${unitColor.wrapper}`}
            >
              <span className={unitColor.label}>単元</span>
              <span className={unitColor.value}>{post.unit}</span>
            </span>
          ) : null}
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
              {post.tags.map((pt: any) => (
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

      {/* 本文：1枚のカードにまとめ、参考URLも統合 */}
      {hasContent ? (
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
          {post.referenceUrl?.trim() ? (
            <div className="space-y-2 p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <span
                  aria-hidden="true"
                  className="inline-block h-4 w-1 rounded-full bg-zinc-400"
                />
                参考URL
              </h2>
              <a
                href={post.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block break-all text-sm text-sky-700 underline-offset-2 hover:underline"
              >
                {post.referenceUrl}
              </a>
            </div>
          ) : null}
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
            {post.attachments.map((a: any) => {
              const downloadable = a.malwareScanStatus === "clean";
              const rowClass =
                "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition";
              const pendingOrError =
                a.malwareScanStatus === "pending" || a.malwareScanStatus === "error";
              const viewHref = `/t/${tenantSlug}/posts/${postId}/attachments/${a.id}`;
              const downloadHref = `/t/${tenantSlug}/files/${a.id}`;
              return (
                <li key={a.id}>
                  {downloadable ? (
                    <div className={`${rowClass} border-zinc-200 bg-white`}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                          {a.kind}
                        </span>
                        <span className="truncate font-medium text-zinc-900">
                          {a.originalFilename}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-wrap items-center gap-3">
                        <span className="text-xs text-zinc-500">
                          {(a.sizeBytes / 1024).toFixed(1)} KiB
                        </span>
                        <span className="flex gap-2">
                          <Link
                            href={viewHref}
                            className="cursor-pointer rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-500"
                          >
                            表示
                          </Link>
                          <Link
                            href={downloadHref}
                            className="cursor-pointer rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                          >
                            ダウンロード
                          </Link>
                        </span>
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`${rowClass} border-amber-200 bg-amber-50/60 text-zinc-700`}
                    >
                      <span className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                            {a.kind}
                          </span>
                          <span className="truncate font-medium">
                            {a.originalFilename}
                          </span>
                          {a.malwareScanStatus === "pending" ? (
                            <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900">
                              マルウェア検査中（ダウンロードは検査完了後）
                            </span>
                          ) : null}
                          {a.malwareScanStatus === "error" ? (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              検査エラー（ダウンロード不可）
                            </span>
                          ) : null}
                          {a.malwareScanStatus === "infected" ? (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                              利用不可
                            </span>
                          ) : null}
                        </span>
                        {pendingOrError && a.malwareScanDetail ? (
                          <span className="text-xs text-zinc-500">
                            {a.malwareScanDetail}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-500">
                        {(a.sizeBytes / 1024).toFixed(1)} KiB
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
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
            <TriedButton
              tenantSlug={tenantSlug}
              postId={postId}
              initialTried={triedInfo.tried}
              initialCount={triedInfo.count}
              canTry={canTry}
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
                className="shrink-0 cursor-pointer rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
                title="印刷・PDF保存"
              >
                PDF
              </Link>
              {canEdit ? (
                <>
                  <Link
                    href={`/t/${tenantSlug}/posts/${postId}/edit?from=detail`}
                    className="shrink-0 cursor-pointer rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
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
