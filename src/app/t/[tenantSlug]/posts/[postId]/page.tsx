import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPost } from "@/app/actions/posts";
import { DeletePostButton } from "@/components/DeletePostButton";
import { isS3Configured } from "@/lib/storage";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
}) {
  const { tenantSlug, postId } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) notFound();

  const post = await getPost(session.user.tenantId, postId);
  if (!post) notFound();

  const canEdit = post.authorId === session.user.id;

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-zinc-500">
            {post.createdAt.toLocaleString("ja-JP")} ·{" "}
            {post.author.name ?? post.author.email}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
            {post.title?.trim() || "（無題）"}
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {post.grade} / {post.subject}
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/t/${tenantSlug}/posts/${postId}/edit`}
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              編集
            </Link>
            <DeletePostButton tenantSlug={tenantSlug} postId={postId} />
          </div>
        ) : null}
      </div>

      {post.tags.length > 0 ? (
        <p className="text-sm text-sky-800">
          {post.tags.map((pt) => `#${pt.tag.name}`).join(" ")}
        </p>
      ) : null}

      <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-800">単元</h2>
        <p className="whitespace-pre-wrap text-sm text-zinc-700">{post.unit}</p>
      </section>

      {post.contentItem ? (
        <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-800">内容項目</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{post.contentItem}</p>
        </section>
      ) : null}

      <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-800">めあて</h2>
        <p className="whitespace-pre-wrap text-sm text-zinc-700">{post.aim}</p>
      </section>

      {post.reflection ? (
        <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-800">振り返り</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">
            {post.reflection}
          </p>
        </section>
      ) : null}

      {post.point ? (
        <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-800">工夫した点</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{post.point}</p>
        </section>
      ) : null}

      {post.flow ? (
        <section className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-800">授業の流れ</h2>
          <p className="whitespace-pre-wrap text-sm text-zinc-700">{post.flow}</p>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-800">添付</h2>
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
                  className="text-sm text-sky-800 underline-offset-2 hover:underline"
                >
                  {a.originalFilename}
                </a>
                <span className="ml-2 text-xs text-zinc-500">
                  ({a.kind}, {(a.sizeBytes / 1024).toFixed(1)} KiB)
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

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
