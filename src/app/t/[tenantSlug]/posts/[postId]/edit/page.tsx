import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  getPost,
  listCurriculumUnitOptions,
  listPostSearchOptions,
} from "@/app/actions/posts";
import { PostEditor } from "@/components/PostEditor";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
}) {
  const { tenantSlug, postId } = await params;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-zinc-900">編集</h1>
        <Link
          href={`/t/${tenantSlug}/posts/${postId}`}
          className="text-sm text-zinc-600 underline-offset-2 hover:underline"
        >
          詳細へ戻る
        </Link>
      </div>
      <PostEditor
        mode="edit"
        tenantSlug={tenantSlug}
        post={post}
        curriculumUnits={curriculumUnits}
        hashtagSuggestions={searchOptions.tags}
      />
    </div>
  );
}
