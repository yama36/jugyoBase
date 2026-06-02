import Link from "next/link";

type Props = {
  tenantSlug: string;
};

/** 事例一覧ページから教科別の共有マップ（/summary）への導線カード */
export function SubjectSummaryMapLinkCard({ tenantSlug }: Props) {
  return (
    <div className="mt-4 rounded-xl border border-sky-200 bg-linear-to-br from-sky-50 to-white p-4 shadow-md shadow-sky-100/60 ring-1 ring-sky-100/80">
      <Link
        href={`/t/${tenantSlug}/summary`}
        className="group block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
      >
        <span className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition group-hover:bg-sky-700 sm:inline-flex sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-base sm:text-sky-800 sm:shadow-none group-hover:sm:text-sky-950">
          教科別の共有マップを見る →
        </span>
        <p className="mt-2 text-center text-xs leading-relaxed text-zinc-600 sm:mt-1.5 sm:text-left sm:text-sm">
          教科ごとの投稿数と単元マップを確認できます
        </p>
      </Link>
    </div>
  );
}
