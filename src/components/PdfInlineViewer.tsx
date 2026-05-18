"use client";

import { useEffect, useRef, useState } from "react";

/**
 * PDF を iframe に直接載せると Content-Disposition 等でダウンロード扱いになることがある。
 * 同一オリジンで fetch して blob URL を作り、ブラウザ内表示を安定させる。
 */
export function PdfInlineViewer(props: {
  streamUrl: string;
  title: string;
  onError?: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const onErrorRef = useRef(props.onError);
  onErrorRef.current = props.onError;

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSrc(null);
      try {
        const res = await fetch(props.streamUrl, { credentials: "same-origin" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        let blob = await res.blob();
        if (blob.type !== "application/pdf") {
          blob = new Blob([await blob.arrayBuffer()], { type: "application/pdf" });
        }
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) onErrorRef.current?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [props.streamUrl]);

  if (loading) {
    return (
      <div className="flex h-[min(80vh,900px)] items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-600">
        PDF を読み込んでいます…
      </div>
    );
  }

  if (!src) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <iframe
        title={props.title}
        src={src}
        className="h-[min(80vh,900px)] w-full bg-zinc-100"
      />
    </div>
  );
}
