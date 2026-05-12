import { PostEditor } from "@/components/PostEditor";
import Link from "next/link";
import {
  createShellDraftPost,
  listCurriculumUnitOptions,
  listPostSearchOptions,
} from "@/app/actions/posts";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (
    !session?.user?.tenantId ||
    !canAccessTenantRoute(session, tenantSlug, { requireTenantId: true })
  ) {
    redirect(`/t/${tenantSlug}/login`);
  }
  const draft = await createShellDraftPost(tenantSlug);
  if (!draft.ok) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {draft.message}
      </div>
    );
  }

  const curriculumUnits = await listCurriculumUnitOptions();
  const searchOptions = await listPostSearchOptions(session.user.tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">新規投稿</h1>
          <p className="mt-1 text-sm text-zinc-600">
            画面を開いた時点で下書きを用意します（空の下書きがあれば再利用）。一番上でファイルを添付してから入力しても構いません。
          </p>
        </div>
        <Link
          href={`/t/${tenantSlug}/posts`}
          className="text-sm text-zinc-600 underline-offset-2 hover:underline"
        >
          事例一覧
        </Link>
      </div>
      <PostEditor
        mode="create"
        tenantSlug={tenantSlug}
        draftPostId={draft.postId}
        curriculumUnits={curriculumUnits}
        hashtagSuggestions={searchOptions.tags}
      />
    </div>
  );
}
