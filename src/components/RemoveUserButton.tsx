"use client";

import { useState, useTransition } from "react";
import { removeUser } from "@/app/actions/admin";
import { ConfirmDialog } from "./ConfirmDialog";

export function RemoveUserButton({
  tenantSlug,
  userId,
}: {
  tenantSlug: string;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await removeUser(tenantSlug, userId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={isPending}
        className="cursor-pointer rounded border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "削除中…" : "削除"}
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) setOpen(next);
        }}
        title="このユーザーを削除しますか？"
        description="削除するとログインできなくなります。この操作は取り消せません。"
        error={error}
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleConfirm}
        pending={isPending}
      />
    </>
  );
}
