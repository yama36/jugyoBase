"use client";

import { VIDEO_COMPRESS } from "@/lib/storage";

export type VideoCompressProgress = (ratio: number) => void;

let ffmpegLoadPromise: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

async function getFfmpeg(): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();
      const baseURL =
        "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd";
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${baseURL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });
      return ffmpeg;
    })();
  }
  return ffmpegLoadPromise;
}

export function shouldCompressVideo(file: File): boolean {
  return file.size >= VIDEO_COMPRESS.minBytesToCompress;
}

function outputFilename(original: string): string {
  const base = original.replace(/\.[^./\\]+$/, "") || "video";
  return `${base}.mp4`;
}

/**
 * 大きな動画を H.264 MP4 に再エンコードして容量を抑える。
 * 初回は ffmpeg.wasm の読み込みに数十秒かかることがある。
 */
export async function compressVideoForUpload(
  file: File,
  onProgress?: VideoCompressProgress,
): Promise<File> {
  const { fetchFile } = await import("@ffmpeg/util");
  const ffmpeg = await getFfmpeg();

  const extMatch = /\.([a-z0-9]+)$/i.exec(file.name);
  const inputName = extMatch ? `input.${extMatch[1]}` : "input.bin";
  const outputName = "output.mp4";

  const progressHandler = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress) && progress >= 0 && progress <= 1) {
      onProgress?.(progress);
    }
  };
  ffmpeg.on("progress", progressHandler);

  try {
    onProgress?.(0);
    await ffmpeg.writeFile(inputName, await fetchFile(file));

    const { maxWidth, maxHeight, crf } = VIDEO_COMPRESS;
    const scaleFilter = `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`;

    await ffmpeg.exec([
      "-i",
      inputName,
      "-vf",
      scaleFilter,
      "-c:v",
      "libx264",
      "-crf",
      String(crf),
      "-preset",
      "fast",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-y",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    if (!(data instanceof Uint8Array) || data.byteLength === 0) {
      throw new Error("empty output");
    }

    const blob = new Blob([data as BlobPart], { type: "video/mp4" });
    const compressed = new File([blob], outputFilename(file.name), {
      type: "video/mp4",
    });

    // 再エンコードで逆に大きくなった場合は元ファイルを使う
    if (compressed.size >= file.size) {
      return file;
    }

    return compressed;
  } finally {
    ffmpeg.off("progress", progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      /* ignore */
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      /* ignore */
    }
  }
}
