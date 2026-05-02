"use client";

import Link from "next/link";
import { useActionState, useRef, useTransition } from "react";
import { createComment, deleteComment } from "@/app/actions/comments";

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
  const canComment =
    Boolean(currentUserId) && currentUserRole !== "readonly";
  const [state, formAction, isPending] = useActionState(createComment, null);
  const [deletePending, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // フォーム送信成功時にテキストエリアをクリア
  if (state?.ok && formRef.current) {
    formRef.current.reset();
  }

  function handleDelete(commentId: string) {
    if (!confirm("このコメントを削除しますか？")) return;
    startDeleteTransition(async () => {
      const result = await deleteComment(tenantSlug, commentId);
      if (!result.ok) alert(result.message);
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
                  <p className="text-xs text-zinc-500">
                    {c.author.name ?? c.author.email} ・{" "}
                    {new Date(c.createdAt).toLocaleString("ja-JP")}
                  </p>
                  {canDelete ? (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletePending}
                      className="shrink-0 text-xs text-zinc-400 hover:text-red-600 disabled:opacity-50"
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
        <form ref={formRef} action={formAction} className="space-y-2">
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
            disabled={isPending}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {isPending ? "送信中…" : "コメントする"}
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
    </section>
  );
}
