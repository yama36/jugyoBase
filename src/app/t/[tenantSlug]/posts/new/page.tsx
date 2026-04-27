import { PostEditor } from "@/components/PostEditor";
import { listCurriculumUnitOptions, listPostSearchOptions } from "@/app/actions/posts";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

export default async function NewPostPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (!session?.user?.tenantId) notFound();
  const curriculumUnits = await listCurriculumUnitOptions();
  const searchOptions = await listPostSearchOptions(session.user.tenantId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-900">新規投稿</h1>
      <PostEditor
        mode="create"
        tenantSlug={tenantSlug}
        curriculumUnits={curriculumUnits}
        hashtagSuggestions={searchOptions.tags}
      />
    </div>
  );
}
