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

type UploadFailure = { filename: string; message: string };

/** MinIO / S3 の XML エラーから Code を抜き出す（403 診断用） */
function s3ErrorHint(status: number, body: string): string {
  const code = body.match(/<Code>([^<]+)<\/Code>/)?.[1];
  if (!code) return "";
  if (code === "SignatureDoesNotMatch") {
    return " — 署名不一致（S3_ENDPOINT と MINIO_SERVER_URL が https://s3.identfill.com か、アプリを再ビルド・再起動したか確認）";
  }
  if (code === "AccessDenied") {
    return " — アクセス拒否（jugyobase-app の書き込み権限・S3_SECRET_ACCESS_KEY を確認）";
  }
  return ` — ${code}`;
}

async function uploadOneFile(
  file: File,
  tenantSlug: string,
  postId: string,
  extensionListHuman: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  let mimeType = (file.type || "").trim().toLowerCase();
  if (!mimeType || mimeType === "application/octet-stream") {
    mimeType = guessMimeFromFilename(file.name) ?? mimeType;
  }
  const kind = inferAttachmentKindFromMime(mimeType);
  if (!kind || !isMimeAllowedForKind(kind, mimeType)) {
    return {
      ok: false,
      message: `対応していない形式です（${extensionListHuman}）`,
    };
  }

  const presign = await presignUploadForPost({
    tenantSlug,
    postId,
    kind,
    mimeType,
    sizeBytes: file.size,
    originalFilename: file.name,
  });
  if (!presign.ok) {
    return { ok: false, message: presign.message };
  }

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    body: await file.arrayBuffer(),
  });
  if (!put.ok) {
    const body = await put.text().catch(() => "");
    const hint = s3ErrorHint(put.status, body);
    return {
      ok: false,
      message: `アップロードに失敗しました (HTTP ${put.status})${hint}`,
    };
  }

  const reg = await registerAttachment({
    tenantSlug,
    postId,
    kind,
    mimeType,
    sizeBytes: file.size,
    originalFilename: file.name,
    storageKey: presign.storageKey,
  });
  if (!reg.ok) {
    return { ok: false, message: reg.message };
  }

  return { ok: true };
}

export function AttachmentUploader(props: {
  tenantSlug: string;
  postId: string;
  /** false のときアップロード不可（サーバーで isS3Configured() を渡す） */
  storageConfigured?: boolean;
  /** マルウェア検査ゲート有効時、登録直後はダウンロード不可である旨を表示 */
  malwareScanGate?: boolean;
}) {
  const storageReady = props.storageConfigured !== false;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [failures, setFailures] = useState<UploadFailure[]>([]);

  const extensionListHuman =
    ALLOWED_FILE_EXTENSIONS_FOR_INPUT.split(",").join("、");

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    // FileList は input.value を空にすると中身も消える。先に配列へコピーする
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (!storageReady) {
      setMessage("ファイルストレージが未設定です。README の MinIO 設定を確認してください。");
      return;
    }
    setBusy(true);
    setMessage(null);
    setFailures([]);
    setProgress({ current: 0, total: files.length });

    const failed: UploadFailure[] = [];
    let succeeded = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        setProgress({ current: i + 1, total: files.length });
        const result = await uploadOneFile(
          files[i],
          props.tenantSlug,
          props.postId,
          extensionListHuman,
        );
        if (result.ok) {
          succeeded++;
        } else {
          failed.push({ filename: files[i].name, message: result.message });
        }
      }

      setFailures(failed);

      if (succeeded === 0) {
        setMessage(
          files.length === 1
            ? failed[0]?.message ?? "添付に失敗しました"
            : `${files.length} 件とも登録できませんでした`,
        );
        return;
      }

      const scanNote = props.malwareScanGate
        ? "マルウェア検査完了後にダウンロードできます。"
        : null;

      if (failed.length === 0) {
        setMessage(
          succeeded === 1
            ? scanNote
              ? `添付を登録しました。${scanNote}`
              : "添付を登録しました"
            : scanNote
              ? `${succeeded} 件の添付を登録しました。${scanNote}`
              : `${succeeded} 件の添付を登録しました`,
        );
      } else {
        setMessage(
          scanNote
            ? `${succeeded} 件を登録しました（${failed.length} 件は失敗）。${scanNote}`
            : `${succeeded} 件を登録しました（${failed.length} 件は失敗）`,
        );
      }

      router.refresh();
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-800">添付ファイル</h3>
      {!storageReady ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-950">
          ファイルストレージ（S3 / MinIO）が未設定のため、添付をアップロードできません。
          <code className="mx-0.5 rounded bg-amber-100 px-1 font-mono text-[11px]">S3_BUCKET</code>
          などを設定し、MinIO バケット（例: <code className="font-mono text-[11px]">jugyobase</code>
          ）を作成してから開発サーバーを再起動してください。
        </p>
      ) : null}
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
          <span className="text-zinc-500">
            （PDF・画像・動画など混在して一度に選択できます。種類は自動判定）
          </span>
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
          PDF・スライド・画像は 25 MB まで、動画は 200 MB までです。
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label
          className={`relative inline-flex items-center justify-center gap-2 rounded-lg border-2 border-sky-700 bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-400 focus-within:ring-offset-2 ${
            !busy
              ? "cursor-pointer hover:bg-sky-500 hover:shadow-lg active:bg-sky-800"
              : "cursor-wait opacity-50"
          }`}
        >
          <svg
            className="pointer-events-none h-5 w-5 shrink-0"
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
          <span className="pointer-events-none">
            {busy ? "アップロード中…" : "ファイルを選択"}
          </span>
          <input
            type="file"
            multiple
            accept={ALLOWED_FILE_EXTENSIONS_FOR_INPUT}
            disabled={busy}
            onChange={onFiles}
            className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            aria-label="添付ファイルをアップロード（複数選択可）"
          />
        </label>
        {progress ? (
          <p className="text-xs text-zinc-600" aria-live="polite">
            {progress.current} / {progress.total} 件を処理中…
          </p>
        ) : null}
      </div>
      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
      {failures.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
          {failures.map((f, i) => (
            <li key={`${f.filename}-${i}`}>
              <span className="font-medium">{f.filename}</span>
              <span className="text-red-800"> — {f.message}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
