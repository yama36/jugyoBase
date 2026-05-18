"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "キャンセル",
  variant = "default",
  onConfirm,
  pending = false,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  pending?: boolean;
  error?: string | null;
}) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, pending, onOpenChange]);

  if (!open || !mounted) return null;

  const confirmClass =
    variant === "destructive"
      ? "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-400"
      : "bg-zinc-900 text-white hover:bg-zinc-800 focus-visible:ring-zinc-400";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        className="absolute inset-0 cursor-pointer bg-black/45 backdrop-blur-[2px]"
        onClick={() => !pending && onOpenChange(false)}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-zinc-900">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-2 text-sm leading-relaxed text-zinc-600">
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm leading-relaxed text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {pending ? "処理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
