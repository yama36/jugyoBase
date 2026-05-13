import Link from "next/link";

export type PublicSiteNavActive = "help" | "contact" | "privacy";

type Props = {
  active?: PublicSiteNavActive;
  /** Inner container max-width utility, e.g. `max-w-3xl` or `max-w-6xl` */
  containerClassName?: string;
};

function linkClass(isActive: boolean) {
  return isActive
    ? "font-medium text-sky-700 hover:text-sky-900"
    : "hover:text-zinc-900";
}

export function PublicSiteHeader({
  active,
  containerClassName = "max-w-3xl",
}: Props) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div
        className={`mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-3 ${containerClassName}`}
      >
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900"
        >
          jugyoBase
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600">
          <Link href="/help" className={linkClass(active === "help")}>
            使い方
          </Link>
          <Link href="/contact" className={linkClass(active === "contact")}>
            お問い合わせ
          </Link>
          <Link href="/privacy" className={linkClass(active === "privacy")}>
            プライバシーポリシー
          </Link>
          <Link href="/" className="hover:text-zinc-900">
            トップへ戻る
          </Link>
        </nav>
      </div>
    </header>
  );
}
