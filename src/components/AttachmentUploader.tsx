"use client";

import type { AttachmentKind } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  presignUploadForPost,
  registerAttachment,
} from "@/app/actions/posts";
import {
  ALLOWED_EXTENSIONS_BY_KIND,
  ALLOWED_FILE_EXTENSIONS_FOR_INPUT,
  guessMimeFromFilename,
  inferAttachmentKindFromMime,
  isMimeAllowedForKind,
} from "@/lib/storage";

const UPLOAD_KIND_ORDER: AttachmentKind[] = [
  "pdf",
  "slide",
  "image",
  "video",
];

const UPLOAD_KIND_LABEL: Record<AttachmentKind, string> = {
  pdf: "PDF",
  slide: "スライド（PowerPoint）",
  image: "画像",
  video: "動画",
};

export function AttachmentUploader(props: {
  tenantSlug: string;
  postId: string;
  /** マルウェア検査ゲート有効時、登録直後はダウンロード不可である旨を表示 */
  malwareScanGate?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const extensionListHuman =
    ALLOWED_FILE_EXTENSIONS_FOR_INPUT.split(",").join("、");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      let mimeType = (file.type || "").trim().toLowerCase();
      if (!mimeType || mimeType === "application/octet-stream") {
        mimeType = guessMimeFromFilename(file.name) ?? mimeType;
      }
      const kind = inferAttachmentKindFromMime(mimeType);
      if (!kind || !isMimeAllowedForKind(kind, mimeType)) {
        setMessage(
          `対応していないファイル形式です。次の拡張子のみアップロードできます：${extensionListHuman}`,
        );
        return;
      }
      const presign = await presignUploadForPost({
        tenantSlug: props.tenantSlug,
        postId: props.postId,
        kind,
        mimeType,
        sizeBytes: file.size,
        originalFilename: file.name,
      });
      if (!presign.ok) {
        setMessage(presign.message);
        return;
      }
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": mimeType },
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
        mimeType,
        sizeBytes: file.size,
        originalFilename: file.name,
        storageKey: presign.storageKey,
      });
      if (!reg.ok) {
        setMessage(reg.message);
        return;
      }
      setMessage(
        props.malwareScanGate
          ? "添付を登録しました。マルウェア検査完了後にダウンロードできます。"
          : "添付を登録しました",
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-800">添付ファイル</h3>
      {props.malwareScanGate ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
          この環境ではマルウェア検査が有効です。登録直後は
          <strong className="font-semibold">検査が終わるまでダウンロードできません</strong>
          （一覧のサムネイルも検査完了後に表示されます）。
        </p>
      ) : null}

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3">
        <p className="text-xs font-medium text-zinc-800">
          このようなファイルがあれば添付してください。（例）
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-zinc-600">
          <li>
            <span className="font-medium text-zinc-700">指導案・単元計画</span>
            …校務や単元の計画書の PDF、配布用の資料 PDF
          </li>
          <li>
            <span className="font-medium text-zinc-700">教材・スライド</span>
            …教材会社の説明スライド、板書代わりの PowerPoint（授業で投影したもの）
          </li>
          <li>
            <span className="font-medium text-zinc-700">ワークシート・板書・学習の様子</span>
            …配布プリントのスキャン、黒板・ホワイトボード、児童生徒の作品の写真
          </li>
          <li>
            <span className="font-medium text-zinc-700">授業の動き</span>
            …教材の使い方のデモ、実験・朗読・グループ学習の様子の動画（短いクリップなど）
          </li>
        </ul>
      </div>

      <div className="space-y-1.5 text-xs text-zinc-600">
        <p>
          <span className="font-medium text-zinc-800">対応拡張子</span>
          <span className="text-zinc-500">（種類はファイルから自動判定）</span>
        </p>
        <ul className="space-y-1 border-l-2 border-zinc-200 pl-3">
          {UPLOAD_KIND_ORDER.map((k) => (
            <li key={k}>
              <span className="text-zinc-700">{UPLOAD_KIND_LABEL[k]}：</span>
              <span className="font-mono text-[11px] text-zinc-600">
                {ALLOWED_EXTENSIONS_BY_KIND[k].join("、")}
              </span>
            </li>
          ))}
        </ul>
        <p className="pt-0.5 text-zinc-500">
          PDF・スライド・画像は 25 MiB まで、動画は 200 MiB までです。
        </p>
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
            accept={ALLOWED_FILE_EXTENSIONS_FOR_INPUT}
            disabled={busy}
            onChange={onFile}
            className="sr-only"
            aria-label="添付ファイルをアップロード"
          />
        </label>
      </div>
      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </div>
  );
}
