"use client";

import { useTransition } from "react";
import { removeUser } from "@/app/actions/admin";

export function RemoveUserButton({
  tenantSlug,
  userId,
}: {
  tenantSlug: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("このユーザーを削除しますか？ログインできなくなります。")) return;
    startTransition(async () => {
      const result = await removeUser(tenantSlug, userId);
      if (!result.ok) alert(result.message);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {isPending ? "削除中…" : "削除"}
    </button>
  );
}
