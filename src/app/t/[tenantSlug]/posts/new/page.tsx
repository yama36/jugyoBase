import { PostEditor } from "@/components/PostEditor";
import { createShellDraftPost } from "@/app/actions/drafts";
import {
  getPost,
  listCurriculumUnitOptions,
  listPostSearchOptions,
} from "@/lib/queries/posts";
import { auth } from "@/auth";
import { isMalwareScanGateEnabled } from "@/lib/malware-scan";
import { isS3Configured } from "@/lib/storage";
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

  const [curriculumUnits, searchOptions, draftPost] = await Promise.all([
    listCurriculumUnitOptions(),
    listPostSearchOptions(session.user.tenantId),
    getPost(session.user.tenantId, draft.postId),
  ]);

  const initialAttachments =
    draftPost?.attachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      originalFilename: a.originalFilename,
      sizeBytes: a.sizeBytes,
      malwareScanStatus: a.malwareScanStatus,
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">新規投稿</h1>
      </div>
      <PostEditor
        mode="create"
        tenantSlug={tenantSlug}
        draftPostId={draft.postId}
        initialDraft={draftPost}
        initialAttachments={initialAttachments}
        curriculumUnits={curriculumUnits}
        hashtagSuggestions={searchOptions.tags}
        malwareScanGate={isMalwareScanGateEnabled()}
        storageConfigured={isS3Configured()}
      />
    </div>
  );
}
