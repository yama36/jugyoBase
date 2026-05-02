"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm hover:bg-zinc-50 print:hidden"
    >
      印刷する / PDF保存
    </button>
  );
}
