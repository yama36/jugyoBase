import type { AttachmentKind } from "@prisma/client";

/** 1ファイルあたりの上限（バイト）。動画は別枠で大きめ。 */
export const STORAGE_LIMITS = {
  defaultMaxBytes: 25 * 1024 * 1024, // 25 MB
  videoMaxBytes: 200 * 1024 * 1024, // 200 MB（MVP: ブラウザ再生しやすい mp4 等を想定）
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
  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-ms-wmv",
    "video/x-m4v",
  ],
};

const FILENAME_EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt": "application/vnd.ms-powerpoint",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".wmv": "video/x-ms-wmv",
  ".m4v": "video/x-m4v",
  ".mov": "video/quicktime",
  ".qt": "video/quicktime",
};

function buildAllowedExtensionsByKind(): Record<
  AttachmentKind,
  readonly string[]
> {
  const acc: Record<AttachmentKind, string[]> = {
    pdf: [],
    slide: [],
    image: [],
    video: [],
  };
  for (const [ext, mime] of Object.entries(FILENAME_EXT_TO_MIME)) {
    const kind = (Object.keys(ALLOWED_MIME_BY_KIND) as AttachmentKind[]).find(
      (k) => (ALLOWED_MIME_BY_KIND[k] as readonly string[]).includes(mime),
    );
    if (kind) acc[kind].push(ext);
  }
  for (const k of Object.keys(acc) as AttachmentKind[]) {
    acc[k].sort((a, b) => a.localeCompare(b));
  }
  return acc;
}

/** 種類ごとの許可拡張子（表示・`accept` と `FILENAME_EXT_TO_MIME` の整合用） */
export const ALLOWED_EXTENSIONS_BY_KIND = buildAllowedExtensionsByKind();

/** ファイル入力の `accept`（拡張子。`FILENAME_EXT_TO_MIME` のキーと一致） */
export const ALLOWED_FILE_EXTENSIONS_FOR_INPUT = Object.keys(
  FILENAME_EXT_TO_MIME,
).join(",");

/** ブラウザが MIME を空にしたり octet-stream にしたときの補助 */
export function guessMimeFromFilename(filename: string): string | null {
  const lower = filename.trim().toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot < 0) return null;
  return FILENAME_EXT_TO_MIME[lower.slice(dot)] ?? null;
}

export function inferAttachmentKindFromMime(mime: string): AttachmentKind | null {
  const m = mime.trim().toLowerCase();
  if (!m) return null;
  for (const kind of Object.keys(ALLOWED_MIME_BY_KIND) as AttachmentKind[]) {
    if (isMimeAllowedForKind(kind, m)) return kind;
  }
  return null;
}

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

/** ブラウザ PUT 時に S3 へ Content-Type を付けないため、取得時は DB の MIME を優先する */
export function resolveAttachmentContentType(
  s3ContentType: string | undefined,
  mimeType: string,
  kind: AttachmentKind,
): string {
  const fromS3 = (s3ContentType ?? "").trim().toLowerCase();
  if (fromS3 && fromS3 !== "application/octet-stream") {
    return fromS3;
  }
  const fromDb = mimeType.trim().toLowerCase();
  if (fromDb && fromDb !== "application/octet-stream") {
    return fromDb;
  }
  const fallbacks: Record<AttachmentKind, string> = {
    pdf: "application/pdf",
    slide:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    image: "image/jpeg",
    video: "video/mp4",
  };
  return fallbacks[kind];
}
