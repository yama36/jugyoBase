"use client";

import type { AttachmentKind } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { withBasePath } from "@/lib/app-base-path";

export function AttachmentViewer(props: {
  kind: AttachmentKind;
  filename: string;
  viewUrl: string | null;
  downloadHref: string;
}) {
  const [loadError, setLoadError] = useState(false);
  const resolvedViewUrl =
    props.viewUrl && props.viewUrl.startsWith("/")
      ? withBasePath(props.viewUrl)
      : props.viewUrl;

  if (props.kind === "slide" || !resolvedViewUrl) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
        <p className="text-sm text-zinc-600">
          スライド（PowerPoint）はブラウザ内でプレビューできません。ダウンロードしてご確認ください。
        </p>
        <Link
          href={props.downloadHref}
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ダウンロード
        </Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center">
        <p className="text-sm text-amber-950">
          プレビューを表示できませんでした。ダウンロードしてご確認ください。
        </p>
        <Link
          href={props.downloadHref}
          className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ダウンロード
        </Link>
      </div>
    );
  }

  if (props.kind === "pdf") {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <object
          data={resolvedViewUrl}
          type="application/pdf"
          title={props.filename}
          className="h-[min(80vh,900px)] w-full bg-zinc-100"
        >
          <iframe
            title={props.filename}
            src={resolvedViewUrl}
            className="h-[min(80vh,900px)] w-full bg-zinc-100"
          />
        </object>
      </div>
    );
  }

  if (props.kind === "image") {
    return (
      <div className="flex justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedViewUrl}
          alt={props.filename}
          className="max-h-[80vh] max-w-full rounded-lg object-contain"
          onError={() => setLoadError(true)}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-black shadow-sm">
      <video
        src={resolvedViewUrl}
        controls
        className="max-h-[80vh] w-full"
        onError={() => setLoadError(true)}
      >
        お使いのブラウザは動画の再生に対応していません。
      </video>
    </div>
  );
}
