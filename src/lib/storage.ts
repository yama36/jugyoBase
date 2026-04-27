import type { AttachmentKind } from "@prisma/client";

/** 1ファイルあたりの上限（バイト）。動画は別枠で大きめ。 */
export const STORAGE_LIMITS = {
  defaultMaxBytes: 25 * 1024 * 1024, // 25 MiB
  videoMaxBytes: 200 * 1024 * 1024, // 200 MiB（MVP: ブラウザ再生しやすい mp4 等を想定）
} as const;

export const ALLOWED_MIME_BY_KIND: Record<
  AttachmentKind,
  readonly string[]
> = {
  pdf: ["application/pdf"],
  slide: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ],
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm"],
};

export function isMimeAllowedForKind(
  kind: AttachmentKind,
  mime: string,
): boolean {
  return (ALLOWED_MIME_BY_KIND[kind] as readonly string[]).includes(mime);
}

export function maxBytesForKind(kind: AttachmentKind): number {
  return kind === "video"
    ? STORAGE_LIMITS.videoMaxBytes
    : STORAGE_LIMITS.defaultMaxBytes;
}

export function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.S3_REGION &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}
