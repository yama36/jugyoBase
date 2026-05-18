import Link from "next/link";
import type { AttachmentSiblingRef } from "@/app/actions/posts";

const KIND_LABEL = {
  pdf: "PDF",
  slide: "スライド",
  image: "画像",
  video: "動画",
} as const;

export function AttachmentSiblingNav(props: {
  tenantSlug: string;
  postId: string;
  siblings: AttachmentSiblingRef[];
  currentIndex: number;
}) {
  const { siblings, currentIndex } = props;
  if (siblings.length <= 1) return null;

  const prev = currentIndex > 0 ? siblings[currentIndex - 1] : null;
  const next =
    currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;
  const base = `/t/${props.tenantSlug}/posts/${props.postId}/attachments`;

  const navBtn =
    "inline-flex min-w-0 max-w-[min(100%,14rem)] items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition";
  const enabled = `${navBtn} border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50`;
  const disabled = `${navBtn} pointer-events-none border-zinc-200 bg-zinc-50 text-zinc-400`;

  return (
    <nav
      aria-label="同一投稿内の添付ファイル"
      className="flex flex-wrap items-stretch justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 px-3 py-3"
    >
      {prev ? (
        <Link href={`${base}/${prev.id}`} className={enabled}>
          <span aria-hidden="true" className="shrink-0 text-zinc-500">
            ←
          </span>
          <span className="min-w-0 truncate">
            <span className="block text-[10px] font-normal text-zinc-500">前へ</span>
            <span className="block truncate">{prev.originalFilename}</span>
          </span>
        </Link>
      ) : (
        <span className={disabled} aria-hidden="true">
          <span className="shrink-0">←</span>
          <span>前へ</span>
        </span>
      )}

      <p className="flex flex-col items-center justify-center px-2 text-center text-xs text-zinc-600">
        <span className="font-medium text-zinc-800">
          {currentIndex + 1} / {siblings.length}
        </span>
        <span className="mt-0.5">
          {KIND_LABEL[siblings[currentIndex]!.kind]}
        </span>
      </p>

      {next ? (
        <Link href={`${base}/${next.id}`} className={`${enabled} ml-auto text-right`}>
          <span className="min-w-0 truncate">
            <span className="block text-[10px] font-normal text-zinc-500">次へ</span>
            <span className="block truncate">{next.originalFilename}</span>
          </span>
          <span aria-hidden="true" className="shrink-0 text-zinc-500">
            →
          </span>
        </Link>
      ) : (
        <span className={`${disabled} ml-auto`} aria-hidden="true">
          <span>次へ</span>
          <span>→</span>
        </span>
      )}
    </nav>
  );
}
