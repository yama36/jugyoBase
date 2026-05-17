import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPost } from "@/app/actions/posts";
import { isMalwareScanGateEnabled } from "@/lib/malware-scan";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";

export default async function PostCompletePage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
}) {
  const { tenantSlug, postId } = await params;
  const session = await auth();
  if (
    !session?.user?.tenantId ||
    !canAccessTenantRoute(session, tenantSlug, { requireTenantId: true })
  ) {
    redirect(`/t/${tenantSlug}/login`);
  }

  const post = await getPost(session.user.tenantId, postId);
  if (!post || post.authorId !== session.user.id) {
    notFound();
  }

  if (!post.isPublished) {
    redirect(`/t/${tenantSlug}/posts/${postId}/edit`);
  }

  const title = post.title?.trim() || "（タイトルなし）";
  const malwareScanGate = isMalwareScanGateEnabled();

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
          Published
        </p>
        <h1 className="mt-3 text-xl font-semibold text-zinc-900">投稿が完了しました</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          「{title}」を共有しました。一覧から他の先生の投稿も確認できます。
        </p>
        {malwareScanGate ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs leading-relaxed text-amber-900">
            添付ファイルがある場合、マルウェア検査が完了するまでダウンロードできません。検査完了後、投稿詳細から取得できます。
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href={`/t/${tenantSlug}/posts/${postId}`}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            投稿を見る
          </Link>
          <Link
            href={`/t/${tenantSlug}/posts`}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            一覧へ戻る
          </Link>
          <Link
            href={`/t/${tenantSlug}/posts/new`}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-sky-700 hover:underline"
          >
            続けて投稿する
          </Link>
        </div>
      </div>
    </div>
  );
}
