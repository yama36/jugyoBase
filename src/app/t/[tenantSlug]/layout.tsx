import Link from "next/link";
import { auth } from "@/auth";
import { signOutFromApp } from "@/app/actions/auth";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  const showNav =
    session?.user?.tenantSlug === tenantSlug &&
    session.user.tenantId;

  return (
    <div className="min-h-dvh bg-zinc-50">
      {showNav ? (
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-3">
            <Link
              href={`/t/${tenantSlug}/posts`}
              className="text-sm font-semibold tracking-tight text-zinc-900"
            >
              jugyoBase
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-700">
              <Link
                href={`/t/${tenantSlug}/posts`}
                className="hover:text-zinc-900"
              >
                事例一覧
              </Link>
              <Link
                href={`/t/${tenantSlug}/posts/new`}
                className="hover:text-zinc-900"
              >
                新規投稿
              </Link>
              <Link href={`/t/${tenantSlug}/mypage`} className="hover:text-zinc-900">
                マイページ
              </Link>
              <form action={signOutFromApp}>
                <button
                  type="submit"
                  className="text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline"
                >
                  ログアウト
                </button>
              </form>
            </nav>
          </div>
        </header>
      ) : null}
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
