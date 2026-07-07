import "server-only";

import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { AttachmentKind } from "@prisma/client";
import sharp from "sharp";
import {
  getObjectBuffer,
  objectExists,
  putObject,
} from "@/lib/s3";

const execFileAsync = promisify(execFile);

const THUMB_WIDTH = 192;
const THUMB_CONTENT_TYPE = "image/webp";

export function buildAttachmentThumbStorageKey(
  tenantId: string,
  postId: string,
  attachmentId: string,
): string {
  return `${tenantId}/${postId}/_thumbs/${attachmentId}-w${THUMB_WIDTH}.webp`;
}

export function isThumbGeneratableKind(kind: AttachmentKind): boolean {
  return kind === "image" || kind === "video" || kind === "pdf";
}

async function resizeToWebpThumb(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

async function extractPdfFirstPage(pdfBuffer: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `jugyobase-pdf-in-${id}.pdf`);
  const outputPath = join(tmpdir(), `jugyobase-pdf-out-${id}.jpg`);
  try {
    await writeFile(inputPath, pdfBuffer);
    await execFileAsync(
      "pdftoppm",
      [
        "-f",
        "1",
        "-l",
        "1",
        "-jpeg",
        "-singlefile",
        "-scale-to",
        String(THUMB_WIDTH),
        inputPath,
        outputPath.replace(/\.jpg$/, ""),
      ],
      { timeout: 60_000 },
    );
    const frame = await sharp(outputPath).toBuffer();
    return resizeToWebpThumb(frame);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

async function extractVideoFrame(videoBuffer: Buffer): Promise<Buffer> {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `jugyobase-thumb-in-${id}`);
  const outputPath = join(tmpdir(), `jugyobase-thumb-out-${id}.jpg`);
  try {
    await writeFile(inputPath, videoBuffer);
    await execFileAsync(
      "ffmpeg",
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-i",
        inputPath,
        "-ss",
        "00:00:01",
        "-vframes",
        "1",
        "-f",
        "image2",
        outputPath,
      ],
      { timeout: 60_000 },
    );
    const frame = await sharp(outputPath).toBuffer();
    return resizeToWebpThumb(frame);
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}

async function generateThumbBuffer(
  kind: AttachmentKind,
  original: Buffer,
): Promise<Buffer> {
  if (kind === "image") {
    return resizeToWebpThumb(original);
  }
  if (kind === "video") {
    return extractVideoFrame(original);
  }
  if (kind === "pdf") {
    return extractPdfFirstPage(original);
  }
  throw new Error("Unsupported attachment kind for thumbnail");
}

export async function getOrCreateAttachmentThumb(params: {
  tenantId: string;
  postId: string;
  attachmentId: string;
  kind: AttachmentKind;
  originalStorageKey: string;
}): Promise<Buffer> {
  const thumbKey = buildAttachmentThumbStorageKey(
    params.tenantId,
    params.postId,
    params.attachmentId,
  );

  if (await objectExists(thumbKey)) {
    return getObjectBuffer(thumbKey);
  }

  const original = await getObjectBuffer(params.originalStorageKey);
  const thumb = await generateThumbBuffer(params.kind, original);
  await putObject({
    storageKey: thumbKey,
    body: thumb,
    contentType: THUMB_CONTENT_TYPE,
  });
  return thumb;
}

export const ATTACHMENT_THUMB_CONTENT_TYPE = THUMB_CONTENT_TYPE;
