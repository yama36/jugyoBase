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
    <div className="rounded-lg border border-zinc-200 p-4">
      <h3 className="text-sm font-semibold text-zinc-900">添付ファイル</h3>
      <p className="mt-1 text-xs text-zinc-600">
        種類を選んでからファイルを選択してください。動画は mp4 / webm を推奨します。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
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
      <div className="mt-3">
        <input
          type="file"
          accept={acceptFor(kind)}
          disabled={busy}
          onChange={onFile}
          className="text-sm"
        />
      </div>
      {message ? <p className="mt-2 text-sm text-zinc-700">{message}</p> : null}
    </div>
  );
}
