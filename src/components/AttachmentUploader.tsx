"use client";

import type { AttachmentKind } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  presignUploadForPost,
  registerAttachment,
} from "@/app/actions/posts";
import { ALLOWED_MIME_BY_KIND } from "@/lib/storage";

const KINDS: { id: AttachmentKind; label: string }[] = [
  { id: "pdf", label: "PDF" },
  { id: "slide", label: "スライド (pptx 等)" },
  { id: "image", label: "画像" },
  { id: "video", label: "動画 (mp4 / webm)" },
];

function acceptFor(kind: AttachmentKind): string {
  return ALLOWED_MIME_BY_KIND[kind].join(",");
}

export function AttachmentUploader(props: {
  tenantSlug: string;
  postId: string;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<AttachmentKind>("pdf");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const kindLabel = KINDS.find((x) => x.id === kind)?.label ?? "ファイル";

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const presign = await presignUploadForPost({
        tenantSlug: props.tenantSlug,
        postId: props.postId,
        kind,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        originalFilename: file.name,
      });
      if (!presign.ok) {
        setMessage(presign.message);
        return;
      }
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok) {
        setMessage(`アップロードに失敗しました (${put.status})`);
        return;
      }
      const reg = await registerAttachment({
        tenantSlug: props.tenantSlug,
        postId: props.postId,
        kind,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        originalFilename: file.name,
        storageKey: presign.storageKey,
      });
      if (!reg.ok) {
        setMessage(reg.message);
        return;
      }
      setMessage("添付を登録しました");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-800">添付ファイル</h3>
      <p className="text-xs text-zinc-600">
        種類を選んでからファイルを選択してください。動画は mp4 / webm を推奨します。
      </p>
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={`rounded px-3 py-1 text-xs font-medium ${
              kind === k.id
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-sky-700 bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-500 hover:shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 focus-within:ring-offset-2 active:bg-sky-800 ${
            busy ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>ファイルを選択</span>
          <input
            type="file"
            accept={acceptFor(kind)}
            disabled={busy}
            onChange={onFile}
            className="sr-only"
            aria-label={`${kindLabel}をアップロード`}
          />
        </label>
        <span className="text-xs text-zinc-500 sm:self-center">
          上の種類（{kindLabel}）に合うファイルを選んでください
        </span>
      </div>
      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </div>
  );
}
