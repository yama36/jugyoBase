import { PostEditor } from "@/components/PostEditor";
import {
  createShellDraftPost,
  listCurriculumUnitOptions,
  listPostSearchOptions,
} from "@/app/actions/posts";
import { auth } from "@/auth";
import { isMalwareScanGateEnabled } from "@/lib/malware-scan";
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
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">新規投稿</h1>
      </div>
      <PostEditor
        mode="create"
        tenantSlug={tenantSlug}
        draftPostId={draft.postId}
        curriculumUnits={curriculumUnits}
        hashtagSuggestions={searchOptions.tags}
        malwareScanGate={isMalwareScanGateEnabled()}
      />
    </div>
  );
}
