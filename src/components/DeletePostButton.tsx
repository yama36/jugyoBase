"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deletePost } from "@/app/actions/posts";

export function DeletePostButton(props: {
  tenantSlug: string;
  postId: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("この投稿を削除しますか？取り消せません。")) return;
        start(async () => {
          const r = await deletePost(props.tenantSlug, props.postId);
          if (!r.ok) {
            window.alert(r.message);
            return;
          }
          router.push(`/t/${props.tenantSlug}/posts`);
          router.refresh();
        });
      }}
      className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-800 hover:bg-red-100 disabled:opacity-50"
    >
      削除
    </button>
  );
}
