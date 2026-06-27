import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getPost,
  listCurriculumUnitOptions,
  listPostSearchOptions,
} from "@/app/actions/posts";
import { PostEditor } from "@/components/PostEditor";
import { isMalwareScanGateEnabled } from "@/lib/malware-scan";
import { isS3Configured } from "@/lib/storage";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";

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
  if (
    !session?.user?.tenantId ||
    !session.user.id ||
    !canAccessTenantRoute(session, tenantSlug, { requireTenantId: true, requireUserId: true })
  ) {
    redirect(`/t/${tenantSlug}/login`);
  }

  const [curriculumUnits, searchOptions, post] = await Promise.all([
    listCurriculumUnitOptions(),
    listPostSearchOptions(session.user.tenantId),
    getPost(session.user.tenantId, postId),
  ]);
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
        storageConfigured={isS3Configured()}
      />
    </div>
  );
}
