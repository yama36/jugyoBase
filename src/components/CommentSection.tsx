"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { createComment, deleteComment } from "@/app/actions/comments";
import { ConfirmDialog } from "./ConfirmDialog";

type Comment = {
  id: string;
  body: string;
  authorId: string;
  createdAt: Date;
  author: { id: string; name: string | null; email: string };
};

export function CommentSection({
  postId,
  tenantSlug,
  currentUserId,
  currentUserRole,
  initialComments,
}: {
  postId: string;
  tenantSlug: string;
  currentUserId?: string | null;
  currentUserRole?: string | null;
  initialComments: Comment[];
}) {
  const router = useRouter();
  const canComment =
    Boolean(currentUserId) && currentUserRole !== "readonly";
  const [state, setState] = useState<
    { ok: true } | { ok: false; error: string } | null
  >(null);
  const [commentPending, startComment] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleCommentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    startComment(async () => {
      const fd = new FormData(form);
      const result = await createComment(null, fd);
      setState(result);
      if (result.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteComment(tenantSlug, deleteTargetId);
      if (!result.ok) {
        setDeleteError(result.message);
        return;
      }
      setDeleteTargetId(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-800">
        コメント ({initialComments.length})
      </h2>

      {initialComments.length > 0 ? (
        <ul className="space-y-3">
          {initialComments.map((c) => {
            const canDelete =
              !!currentUserId &&
              (c.authorId === currentUserId || currentUserRole === "admin");
            return (
              <li key={c.id} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <time
                    dateTime={new Date(c.createdAt).toISOString()}
                    className="text-xs text-zinc-500"
                  >
                    {new Date(c.createdAt).toLocaleString("ja-JP")}
                  </time>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTargetId(c.id);
                      }}
                      disabled={deletePending}
                      className="shrink-0 cursor-pointer text-xs text-zinc-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      削除
                    </button>
                  ) : null}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                  {c.body}
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">まだコメントはありません</p>
      )}

      {canComment ? (
        <form
          ref={formRef}
          onSubmit={handleCommentSubmit}
          className="space-y-2"
        >
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <textarea
            name="body"
            rows={3}
            placeholder="コメントを入力…"
            maxLength={1000}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
          />
          {state && !state.ok ? (
            <p className="text-xs text-red-600">{state.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={commentPending}
            className="cursor-pointer rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {commentPending ? "送信中…" : "コメントする"}
          </button>
        </form>
      ) : !currentUserId ? (
        <p className="text-xs text-zinc-500">
          <Link
            href={`/t/${tenantSlug}/login`}
            className="text-sky-700 underline-offset-2 hover:underline"
          >
            ログイン
          </Link>
          するとコメントできます
        </p>
      ) : (
        <p className="text-xs text-zinc-400">閲覧専用アカウントはコメントできません</p>
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(next) => {
          if (!deletePending && !next) {
            setDeleteTargetId(null);
            setDeleteError(null);
          }
        }}
        title="このコメントを削除しますか？"
        description="削除すると元に戻せません。"
        error={deleteError}
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        pending={deletePending}
      />
    </section>
  );
}
