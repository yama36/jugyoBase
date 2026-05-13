"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** 送信完了ページ表示時に一度だけ成功トーストを出す */
export function SentSuccessToast() {
  useEffect(() => {
    toast.success("送信しました", { id: "contact-sent-success" });
  }, []);
  return null;
}
