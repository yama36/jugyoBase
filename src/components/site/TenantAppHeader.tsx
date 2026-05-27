import Link from "next/link";
import { signOutFromApp } from "@/app/actions/auth";

type Props = {
  tenantSlug: string;
  variant: "full" | "demo";
  /** Logged-in user's tenant slug when variant is demo (for 「自分の学校へ」) */
  sessionTenantSlug?: string | null;
  isAdmin: boolean;
  isReadonly: boolean;
  unreadCount: number;
};

export function TenantAppHeader({
  tenantSlug,
  variant,
  sessionTenantSlug,
  isAdmin,
  isReadonly,
  unreadCount,
}: Props) {
  if (variant === "full") {
    return (
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link
            href={`/t/${tenantSlug}/posts`}
            className="text-sm font-semibold tracking-tight text-zinc-900"
          >
            jugyoBase
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-700">
            <Link href={`/t/${tenantSlug}/posts`} className="hover:text-zinc-900">
              事例一覧
            </Link>
            {!isReadonly ? (
              <Link href={`/t/${tenantSlug}/posts/new`} className="hover:text-zinc-900">
                新規投稿
              </Link>
            ) : null}
            <Link href={`/t/${tenantSlug}/mypage`} className="hover:text-zinc-900">
              マイページ
            </Link>
            <Link href={`/t/${tenantSlug}/summary`} className="hover:text-zinc-900">
              教科別一覧
            </Link>
            {isAdmin ? (
              <Link href={`/t/${tenantSlug}/stats`} className="hover:text-zinc-900">
                統計
              </Link>
            ) : null}
            <Link
              href={`/t/${tenantSlug}/notifications`}
              className="relative hover:text-zinc-900"
              title="通知"
            >
              🔔
              {unreadCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
            {isAdmin ? (
              <Link
                href={`/t/${tenantSlug}/admin/users`}
                className="font-medium text-purple-700 hover:text-purple-900"
              >
                管理
              </Link>
            ) : null}
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
    );
  }

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <Link
          href={`/t/${tenantSlug}/posts`}
          className="text-sm font-semibold tracking-tight text-zinc-900"
        >
          jugyoBase <span className="font-normal text-zinc-500">（デモ閲覧）</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-700">
          <Link href={`/t/${tenantSlug}/posts`} className="hover:text-zinc-900">
            事例一覧
          </Link>
          {sessionTenantSlug ? (
            <Link
              href={`/t/${sessionTenantSlug}/posts`}
              className="text-sky-700 hover:text-sky-900"
            >
              自分の学校へ
            </Link>
          ) : null}
          <Link
            href={`/t/${tenantSlug}/login`}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 hover:bg-zinc-50"
          >
            ログイン
          </Link>
        </nav>
      </div>
    </header>
  );
}
