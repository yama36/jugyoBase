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

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
}) {
  const { tenantSlug, postId } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) notFound();

  const [post, comments, likeInfo, bookmarked] = await Promise.all([
    getPost(session.user.tenantId, postId),
    listComments(session.user.tenantId, postId),
    getPostLikeInfo(session.user.tenantId, postId, session.user.id),
    getBookmarkStatus(postId, session.user.id),
  ]);
  if (!post) notFound();

  const canEdit =
    post.authorId === session.user.id || session.user.role === "admin";
  const canLike = session.user.role !== "readonly";

  const metaItems = [
    { label: "学年", value: post.grade },
    { label: "教科", value: post.subject },
    { label: "単元", value: post.unit },
  ];
  const contentSections = [
    { key: "aim", title: "めあて", value: post.aim },
    { key: "reflection", title: "振り返り", value: post.reflection },
    { key: "point", title: "工夫した点", value: post.point },
    { key: "flow", title: "授業の流れ", value: post.flow },
  ].filter((section) => section.value && section.value.trim().length > 0);

  return (
    <article className="space-y-8">
      <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">
              {post.createdAt.toLocaleString("ja-JP")} ・{" "}
              {post.author.name ?? post.author.email}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              {post.title?.trim() || "（無題）"}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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
                  href={`/t/${tenantSlug}/posts/${postId}/edit`}
                  className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
                >
                  編集
                </Link>
                <DeletePostButton tenantSlug={tenantSlug} postId={postId} />
              </>
            ) : null}
          </div>
        </div>
        <dl className="mt-4 grid gap-2 sm:grid-cols-3">
          {metaItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <dt className="text-xs font-medium text-zinc-500">{item.label}</dt>
              <dd className="mt-1 text-sm text-zinc-800">{item.value}</dd>
            </div>
          ))}
        </dl>
        {post.contentItem ? (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium text-zinc-500">内容項目</p>
            <p className="mt-1 text-sm text-zinc-800">{post.contentItem}</p>
          </div>
        ) : null}
        {post.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((pt) => (
              <li
                key={pt.tag.id}
                className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800"
              >
                #{pt.tag.name}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <section className="grid gap-4">
        {contentSections.map((section) => (
          <section
            key={section.key}
            className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-zinc-800">{section.title}</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700">
              {section.value}
            </p>
          </section>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-800">添付ファイル</h2>
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
                    <span className="truncate text-sky-800">{a.originalFilename}</span>
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
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
        initialComments={comments}
      />

      <p className="text-sm">
        <Link
          href={`/t/${tenantSlug}/posts`}
          className="text-zinc-600 underline-offset-2 hover:underline"
        >
          ← 一覧へ
        </Link>
      </p>
    </article>
  );
}
