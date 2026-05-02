import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { listPostSearchOptions, listPosts } from "@/app/actions/posts";
import { AutoRefresh } from "@/components/AutoRefresh";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";

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

  const posts = await listPosts(tenantId, {
    q,
    grade,
    subject,
    unit,
    tag,
  });
  const options = await listPostSearchOptions(tenantId);
  const hasSearchParams = Boolean(q || grade || subject || unit || tag);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">授業実践</h1>
          <p className="mt-1 text-sm text-zinc-600">
            学年・教科・単元・タグ・キーワードで絞り込めます
          </p>
          <div className="mt-2">
            <AutoRefresh />
          </div>
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

      <details
        open={hasSearchParams}
        className="rounded-lg border border-zinc-200 bg-white"
      >
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-zinc-800">
          検索条件
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
          <div className="flex items-end gap-2 sm:col-span-2">
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

      <ul className="space-y-3">
        {posts.length === 0 ? (
          <li className="rounded border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
            まだ投稿がありません
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
                  {post.contentItem ? ` / ${post.contentItem}` : ""}
                </p>
                {post.tags.length > 0 ? (
                  <p className="mt-2 text-xs text-sky-700">
                    {post.tags.map((pt) => `#${pt.tag.name}`).join(" ")}
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                  <span>♥ {(post as any)._count?.likes ?? 0}</span>
                  <span>💬 {(post as any)._count?.comments ?? 0}</span>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
