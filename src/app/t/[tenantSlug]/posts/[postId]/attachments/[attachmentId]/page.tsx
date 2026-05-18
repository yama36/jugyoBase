import Link from "next/link";
import { notFound } from "next/navigation";
import { getAttachmentViewData } from "@/app/actions/posts";
import { AttachmentViewer } from "@/components/AttachmentViewer";
import { isS3Configured } from "@/lib/storage";

const KIND_LABEL = {
  pdf: "PDF",
  slide: "スライド",
  image: "画像",
  video: "動画",
} as const;

export default async function AttachmentViewPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postId: string; attachmentId: string }>;
}) {
  const { tenantSlug, postId, attachmentId } = await params;

  if (!isS3Configured()) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        ファイルストレージが未設定のため、添付を表示できません。
        <Link
          href={`/t/${tenantSlug}/posts/${postId}`}
          className="mt-4 block text-sky-700 hover:underline"
        >
          投稿に戻る
        </Link>
      </div>
    );
  }

  const data = await getAttachmentViewData(tenantSlug, postId, attachmentId);
  if (!data.ok) {
    if (data.httpStatus === 404) notFound();
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {data.message}
        <Link
          href={`/t/${tenantSlug}/posts/${postId}`}
          className="mt-4 block text-sky-800 hover:underline"
        >
          投稿に戻る
        </Link>
      </div>
    );
  }

  const { attachment, postTitle } = data;
  const postHref = `/t/${tenantSlug}/posts/${postId}`;
  const downloadHref = `/t/${tenantSlug}/files/${attachmentId}`;

  return (
    <article className="space-y-6">
      <nav
        aria-label="breadcrumb"
        className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500"
      >
        <Link href={`/t/${tenantSlug}/posts`} className="hover:text-zinc-800 hover:underline">
          事例一覧
        </Link>
        <span aria-hidden="true" className="text-zinc-300">
          /
        </span>
        <Link href={postHref} className="max-w-[40ch] truncate hover:text-zinc-800 hover:underline">
          {postTitle}
        </Link>
        <span aria-hidden="true" className="text-zinc-300">
          /
        </span>
        <span className="truncate text-zinc-700">添付の表示</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            {KIND_LABEL[attachment.kind]}
          </p>
          <h1 className="mt-1 break-all text-lg font-semibold text-zinc-900">
            {attachment.originalFilename}
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            {(attachment.sizeBytes / 1024).toFixed(1)} KiB
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={postHref}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            投稿に戻る
          </Link>
          <Link
            href={downloadHref}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            ダウンロード
          </Link>
        </div>
      </header>

      <AttachmentViewer
        kind={attachment.kind}
        filename={attachment.originalFilename}
        viewUrl={attachment.viewUrl}
        downloadHref={downloadHref}
      />
    </article>
  );
}
