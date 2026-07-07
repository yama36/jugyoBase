import Image from "next/image";
import { withBasePath } from "@/lib/app-base-path";
import type { PostThumbAttachment } from "@/lib/post-thumb";

type PostListThumbnailProps = {
  tenantSlug: string;
  attachment: PostThumbAttachment;
};

export function PostListThumbnail({
  tenantSlug,
  attachment,
}: PostListThumbnailProps) {
  const thumbHref = withBasePath(`/t/${tenantSlug}/files/${attachment.id}`);
  const canRenderThumb =
    attachment.kind === "image" ||
    attachment.kind === "video" ||
    attachment.kind === "pdf";

  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
      {canRenderThumb ? (
        <>
          <Image
            unoptimized
            src={`${thumbHref}?thumb=1`}
            alt={attachment.originalFilename}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
          {attachment.kind === "video" ? (
            <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
              動画
            </span>
          ) : null}
          {attachment.kind === "pdf" ? (
            <span className="pointer-events-none absolute bottom-1 right-1 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
              PDF
            </span>
          ) : null}
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] text-zinc-600">
          添付
        </div>
      )}
    </div>
  );
}
