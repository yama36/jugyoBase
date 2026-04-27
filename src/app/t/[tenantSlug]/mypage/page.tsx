import Link from "next/link";
import { auth } from "@/auth";
import { listPosts } from "@/app/actions/posts";

export default async function MyPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return null;
  }

  const posts = await listPosts(session.user.tenantId, {
    authorId: session.user.id,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">マイページ</h1>
          <p className="mt-1 text-sm text-zinc-600">
            自分が投稿した授業実践を管理できます
          </p>
        </div>
        <Link
          href={`/t/${tenantSlug}/posts/new`}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          新規投稿
        </Link>
      </div>

      <ul className="space-y-3">
        {posts.length === 0 ? (
          <li className="rounded border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
            まだ投稿がありません。最初の実践を投稿してみましょう。
          </li>
        ) : (
          posts.map((post) => (
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
    </div>
  );
}
