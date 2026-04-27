const MAX_TAGS = 30;
const MAX_TAG_LEN = 40;

/** 入力文字列から正規化したタグ名（#なし・小文字）の配列 */
export function parseHashtagInput(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  const parts = raw
    .split(/[\s,、，]+/u)
    .map((s) => s.replace(/^#+/, "").trim().toLowerCase())
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const t = p.slice(0, MAX_TAG_LEN);
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}
