import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { listPosts } from "@/app/actions/posts";
import { listBookmarkedPosts } from "@/app/actions/bookmarks";
import { isDemoTenantSlug } from "@/lib/demo-public";

export default async function MyPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    if (isDemoTenantSlug(tenantSlug)) {
      redirect(`/t/${tenantSlug}/posts`);
    }
    return null;
  }

  const [posts, bookmarkedPosts] = await Promise.all([
    listPosts(session.user.tenantId, {
      authorId: session.user.id,
      includeDrafts: true,
    }),
    listBookmarkedPosts(session.user.tenantId, session.user.id),
  ]);

  const published = posts.filter((p) => (p as any).isPublished !== false);
  const drafts = posts.filter((p) => (p as any).isPublished === false);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">マイページ</h1>
          <p className="mt-1 text-sm text-zinc-600">
            自分が投稿した授業実践を管理できます
          </p>
          <Link
            href={`/t/${tenantSlug}/profile/edit`}
            className="mt-2 inline-block text-sm text-zinc-500 underline-offset-2 hover:underline"
          >
            プロフィール編集
          </Link>
        </div>
        {session.user.role !== "readonly" ? (
          <Link
            href={`/t/${tenantSlug}/posts/new`}
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            新規投稿
          </Link>
        ) : null}
      </div>

      {drafts.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-600">
            下書き（{drafts.length}件）
          </h2>
          <ul className="space-y-3">
            {drafts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}/edit`}
                  className="block rounded-lg border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
                        下書き
                      </span>
                      <h2 className="font-medium text-zinc-900">
                        {post.title?.trim() || "（無題）"}
                      </h2>
                    </span>
                    <time
                      dateTime={post.createdAt.toISOString()}
                      className="text-xs text-zinc-500"
                    >
                      {post.createdAt.toLocaleDateString("ja-JP")}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    {post.grade} / {post.subject} / {post.unit}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        {drafts.length > 0 ? (
          <h2 className="text-sm font-semibold text-zinc-600">
            公開済み（{published.length}件）
          </h2>
        ) : null}
        <ul className="space-y-3">
          {published.length === 0 ? (
            <li className="rounded border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
              まだ投稿がありません。最初の実践を投稿してみましょう。
            </li>
          ) : (
            published.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-medium text-zinc-900">
                      {post.title?.trim() || "（無題）"}
                    </h2>
                    <time
                      dateTime={post.createdAt.toISOString()}
                      className="text-xs text-zinc-500"
                    >
                      {post.createdAt.toLocaleDateString("ja-JP")}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    {post.grade} / {post.subject} / {post.unit}
                  </p>
                  {post.tags.length > 0 ? (
                    <p className="mt-2 text-xs text-sky-700">
                      {post.tags.map((pt) => `#${pt.tag.name}`).join(" ")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-600">
          ブックマーク（{bookmarkedPosts.length}件）
        </h2>
        {bookmarkedPosts.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
            ブックマークした授業実践がここに表示されます
          </div>
        ) : (
          <ul className="space-y-3">
            {bookmarkedPosts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}`}
                  className="block rounded-lg border border-amber-200 bg-amber-50 p-4 transition hover:border-amber-300"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="text-amber-500">★</span>
                      <h2 className="font-medium text-zinc-900">
                        {post.title?.trim() || "（無題）"}
                      </h2>
                    </span>
                    <time
                      dateTime={post.createdAt.toISOString()}
                      className="text-xs text-zinc-500"
                    >
                      {post.createdAt.toLocaleDateString("ja-JP")}
                    </time>
                  </div>
                  <p className="mt-2 text-sm text-zinc-600">
                    {post.grade} / {post.subject} / {post.unit}
                  </p>
                  {post.tags.length > 0 ? (
                    <p className="mt-2 text-xs text-sky-700">
                      {post.tags.map((pt) => `#${pt.tag.name}`).join(" ")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
