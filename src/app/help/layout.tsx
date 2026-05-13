import Link from "next/link";

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            jugyoBase
          </Link>
          <nav className="text-sm text-zinc-600">
            <Link href="/" className="hover:text-zinc-900">
              トップへ戻る
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
