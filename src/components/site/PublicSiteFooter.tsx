import Link from "next/link";

type Props = {
  /** Inner container max-width utility */
  containerClassName?: string;
  /** When false, omits top margin so the footer can sit flush after flex-1 main */
  className?: string;
};

export function PublicSiteFooter({
  containerClassName = "max-w-3xl",
  className = "mt-8 border-t border-zinc-200 bg-white",
}: Props) {
  return (
    <footer className={className}>
      <div
        className={`mx-auto flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-zinc-500 ${containerClassName}`}
      >
        <span>jugyoBase</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href="/help" className="hover:text-zinc-800">
            使い方
          </Link>
          <Link href="/contact" className="text-sky-700 hover:text-sky-900">
            お問い合わせ
          </Link>
          <Link href="/privacy" className="hover:text-zinc-800">
            プライバシーポリシー
          </Link>
        </span>
      </div>
    </footer>
  );
}
