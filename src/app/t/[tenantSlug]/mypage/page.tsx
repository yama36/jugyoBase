import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listPosts } from "@/lib/queries/posts";
import { listBookmarkedPosts } from "@/lib/queries/bookmarks";
import { isNewPostShellDraft } from "@/lib/post-shell-draft";
import { isDemoTenantSlug } from "@/lib/demo-public";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { pickPostThumbAttachment, type PostThumbAttachment } from "@/lib/post-thumb";
import { DeletePostButton } from "@/components/DeletePostButton";
import { PostListThumbnail } from "@/components/PostListThumbnail";
import { PostMetaBadges } from "@/components/PostMetaBadges";

type MyPagePost = {
  id: string;
  title: string | null;
  grade: string;
  subject: string;
  unit: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  tags: { tag: { name: string } }[];
  hasCurriculumUnitOptions?: boolean;
  attachments?: PostThumbAttachment[];
};

function MyPagePostBody({
  tenantSlug,
  post,
  title,
  displayDate,
}: {
  tenantSlug: string;
  post: MyPagePost;
  title: ReactNode;
  displayDate: Date;
}) {
  const thumbAttachment = pickPostThumbAttachment(post.attachments);

  return (
    <div className="flex gap-4">
      {thumbAttachment ? (
        <PostListThumbnail tenantSlug={tenantSlug} attachment={thumbAttachment} />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {title}
          <time
            dateTime={displayDate.toISOString()}
            className="text-xs text-zinc-500"
          >
            {displayDate.toLocaleDateString("ja-JP")}
          </time>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <PostMetaBadges
            category={post.category}
            grade={post.grade}
            subject={post.subject}
            unit={post.unit}
            hasCurriculumUnitOptions={post.hasCurriculumUnitOptions}
          />
        </div>
        {post.tags.length > 0 ? (
          <p className="mt-2 text-xs text-sky-700">
            {post.tags.map((pt) => `#${pt.tag.name}`).join(" ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default async function MyPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (
    !session?.user?.tenantId ||
    !session.user.id ||
    !canAccessTenantRoute(session, tenantSlug, { requireTenantId: true, requireUserId: true })
  ) {
    if (isDemoTenantSlug(tenantSlug)) {
      redirect(`/t/${tenantSlug}/posts`);
    }
    redirect(`/t/${tenantSlug}/login`);
  }

  const [posts, bookmarkedPosts] = await Promise.all([
    listPosts(session.user.tenantId, {
      authorId: session.user.id,
      includeDrafts: true,
    }),
    listBookmarkedPosts(session.user.tenantId, session.user.id),
  ]);

  const myPosts = posts as MyPagePost[];
  const myBookmarks = bookmarkedPosts as MyPagePost[];

  const published = myPosts.filter((p) => p.isPublished !== false);
  const drafts = myPosts.filter(
    (p) =>
      p.isPublished === false &&
      !isNewPostShellDraft({
        isPublished: p.isPublished,
        category: p.category,
        title: p.title,
        grade: p.grade,
        subject: p.subject,
        unit: p.unit,
        aim: (p as { aim?: string }).aim ?? "",
        contentItem: (p as { contentItem?: string | null }).contentItem ?? null,
        reflection: (p as { reflection?: string | null }).reflection ?? null,
        point: (p as { point?: string | null }).point ?? null,
        flow: (p as { flow?: string | null }).flow ?? null,
        referenceUrl: (p as { referenceUrl?: string | null }).referenceUrl ?? null,
      }),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">マイページ</h1>
          <p className="mt-1 text-sm text-zinc-600">
            自分が投稿した授業実践を管理できます
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/t/${tenantSlug}/profile/edit`}
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            プロフィールを編集
          </Link>
          {session.user.role !== "readonly" ? (
            <Link
              href={`/t/${tenantSlug}/posts/new`}
              className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              新規投稿
            </Link>
          ) : null}
        </div>
      </div>

      {drafts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-600">
            下書き（{drafts.length}件）
          </h2>
          <ul className="space-y-3">
            {drafts.map((post) => (
              <li
                key={post.id}
                className="flex items-stretch gap-2 rounded-lg border border-amber-200 bg-amber-50 transition hover:border-amber-300"
              >
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}/edit?from=mypage`}
                  className="min-w-0 flex-1 p-4"
                >
                  <MyPagePostBody
                    tenantSlug={tenantSlug}
                    post={post}
                    displayDate={post.updatedAt}
                    title={
                      <span className="flex items-center gap-2">
                        <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                          下書き
                        </span>
                        <h2 className="font-medium text-zinc-900">
                          {post.title?.trim() || "（無題）"}
                        </h2>
                      </span>
                    }
                  />
                </Link>
                <div className="flex shrink-0 items-center border-l border-amber-200 px-3">
                  <DeletePostButton
                    tenantSlug={tenantSlug}
                    postId={post.id}
                    redirectTo={`/t/${tenantSlug}/mypage`}
                    confirmTitle="この下書きを削除しますか？"
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-600">
          公開済み（{published.length}件）
        </h2>
        <ul className="space-y-3">
          {published.length === 0 ? (
            <li className="rounded border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
              まだ投稿がありません。最初の実践を投稿してみましょう。
            </li>
          ) : (
            published.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}?from=mypage`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300"
                >
                  <MyPagePostBody
                    tenantSlug={tenantSlug}
                    post={post}
                    displayDate={post.createdAt}
                    title={
                      <h2 className="font-medium text-zinc-900">
                        {post.title?.trim() || "（無題）"}
                      </h2>
                    }
                  />
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-600">
          ブックマーク（{myBookmarks.length}件）
        </h2>
        {myBookmarks.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
            ブックマークした授業実践がここに表示されます
          </div>
        ) : (
          <ul className="space-y-3">
            {myBookmarks.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}?from=mypage`}
                  className="block rounded-lg border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300"
                >
                  <MyPagePostBody
                    tenantSlug={tenantSlug}
                    post={post}
                    displayDate={post.createdAt}
                    title={
                      <span className="flex items-center gap-2">
                        <span className="text-amber-500">★</span>
                        <h2 className="font-medium text-zinc-900">
                          {post.title?.trim() || "（無題）"}
                        </h2>
                      </span>
                    }
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
