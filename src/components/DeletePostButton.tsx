"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePost } from "@/app/actions/posts";
import { ConfirmDialog } from "./ConfirmDialog";

export function DeletePostButton(props: {
  tenantSlug: string;
  postId: string;
  /** 削除成功後の遷移先（省略時は事例一覧） */
  redirectTo?: string;
  confirmTitle?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function handleConfirm() {
    setError(null);
    start(async () => {
      const r = await deletePost(props.tenantSlug, props.postId);
      if (!r.ok) {
        setError(r.message);
        return;
      }
      setOpen(false);
      router.push(
        props.redirectTo ?? `/t/${props.tenantSlug}/posts`,
      );
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="cursor-pointer rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-800 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        削除
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        title={props.confirmTitle ?? "この投稿を削除しますか？"}
        description="削除すると元に戻せません。添付ファイルもあわせて削除されます。"
        error={error}
        confirmLabel="削除する"
        cancelLabel="キャンセル"
        variant="destructive"
        onConfirm={handleConfirm}
        pending={pending}
      />
    </>
  );
}
