"use client";

import imageCompression from "browser-image-compression";
import { IMAGE_COMPRESS } from "@/lib/storage";

function outputFilename(original: string, mimeType: string): string {
  const base = original.replace(/\.[^./\\]+$/, "") || "image";
  if (mimeType === "image/png") return `${base}.png`;
  if (mimeType === "image/jpeg") return `${base}.jpg`;
  return `${base}.webp`;
}

export function shouldCompressImage(file: File, mimeType: string): boolean {
  const mime = mimeType.trim().toLowerCase();
  if (
    (IMAGE_COMPRESS.skipMimeTypes as readonly string[]).includes(mime)
  ) {
    return false;
  }
  return file.size >= IMAGE_COMPRESS.minBytesToCompress;
}

function outputMimeForSource(mimeType: string): "image/webp" | "image/jpeg" | "image/png" {
  const mime = mimeType.trim().toLowerCase();
  if (mime === "image/png") return "image/png";
  if (mime === "image/jpeg") return "image/jpeg";
  return "image/webp";
}

/**
 * 大きな写真・スキャン画像をリサイズ・再圧縮する（EXIF 向きも補正）。
 * GIF はアニメーション保持のため対象外。
 */
export async function compressImageForUpload(
  file: File,
  mimeType: string,
): Promise<File> {
  const outputMime = outputMimeForSource(mimeType);
  const { maxWidthOrHeight, initialQuality } = IMAGE_COMPRESS;

  const compressed = await imageCompression(file, {
    maxWidthOrHeight,
    initialQuality,
    useWebWorker: true,
    fileType: outputMime,
    preserveExif: false,
  });

  const named = new File(
    [compressed],
    outputFilename(file.name, outputMime),
    { type: outputMime },
  );

  if (named.size >= file.size) {
    return file;
  }

  return named;
}
