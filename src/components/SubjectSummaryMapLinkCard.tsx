import Link from "next/link";

type Props = {
  tenantSlug: string;
};

/** 事例一覧ページから教科別の共有マップ（/summary）への導線カード */
export function SubjectSummaryMapLinkCard({ tenantSlug }: Props) {
  return (
    <div className="mt-4 rounded-xl border border-sky-200 bg-linear-to-br from-sky-50 to-white px-4 py-3 shadow-md shadow-sky-100/60 ring-1 ring-sky-100/80">
      <Link
        href={`/t/${tenantSlug}/summary`}
        className="group flex flex-wrap items-baseline gap-x-2 gap-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        <span className="text-sm font-semibold text-sky-800 transition group-hover:text-sky-950 sm:text-base">
          教科別の共有マップを見る →
        </span>
        <span className="text-xs leading-relaxed text-zinc-600 sm:text-sm">
          教科ごとの投稿数と単元マップを確認できます
        </span>
      </Link>
    </div>
  );
}
