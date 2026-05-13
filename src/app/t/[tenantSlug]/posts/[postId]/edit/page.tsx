import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getPost,
  listCurriculumUnitOptions,
  listPostSearchOptions,
} from "@/app/actions/posts";
import { PostEditor } from "@/components/PostEditor";
import { isMalwareScanGateEnabled } from "@/lib/malware-scan";

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tenantSlug, postId } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.tenantId) notFound();

  const curriculumUnits = await listCurriculumUnitOptions();
  const searchOptions = await listPostSearchOptions(session.user.tenantId);
  const post = await getPost(session.user.tenantId, postId);
  if (!post) notFound();
  if (post.authorId !== session.user.id) {
    return (
      <p className="text-sm text-red-600">
        編集できるのは作成者のみです。
        <Link href={`/t/${tenantSlug}/posts/${postId}`} className="underline">
          詳細へ
        </Link>
      </p>
    );
  }

  // 戻り先は ?from=mypage|detail で明示。未指定時は下書きならマイページ、
  // 公開済みなら詳細にフォールバックする。
  const fromParam = typeof sp.from === "string" ? sp.from : undefined;
  const isDraft = (post as { isPublished?: boolean }).isPublished === false;
  const fallback: "mypage" | "detail" = isDraft ? "mypage" : "detail";
  const from: "mypage" | "detail" =
    fromParam === "mypage" || fromParam === "detail" ? fromParam : fallback;
  const backHref =
    from === "mypage"
      ? `/t/${tenantSlug}/mypage`
      : `/t/${tenantSlug}/posts/${postId}`;
  const backLabel = from === "mypage" ? "← マイページへ" : "← 詳細へ";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">編集</h1>
          <p className="mt-1 text-sm text-zinc-600">
            一番上でファイルを添付できます。内容を更新したら保存してください。
          </p>
        </div>
        <Link
          href={backHref}
          className="text-sm text-zinc-600 underline-offset-2 hover:underline"
        >
          {backLabel}
        </Link>
      </div>
      <PostEditor
        mode="edit"
        tenantSlug={tenantSlug}
        post={post}
        curriculumUnits={curriculumUnits}
        hashtagSuggestions={searchOptions.tags}
        malwareScanGate={isMalwareScanGateEnabled()}
      />
    </div>
  );
}
