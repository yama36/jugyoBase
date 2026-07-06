"use client";

import { useState, type ReactNode } from "react";
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

function MenuToggleIcon({ open }: { open: boolean }) {
  return (
    <span className="relative inline-block h-5 w-5" aria-hidden>
      <span
        className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          open ? "top-[9px] rotate-45" : "top-0.5"
        }`}
      />
      <span
        className={`absolute left-0 top-[9px] block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-5 rounded-full bg-current transition-all duration-300 ease-in-out motion-reduce:transition-none ${
          open ? "top-[9px] -rotate-45" : "top-4"
        }`}
      />
    </span>
  );
}

function MobileMenuButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex h-10 w-10 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 sm:hidden"
      aria-label={open ? "メニューを閉じる" : "メニューを開く"}
      aria-expanded={open}
    >
      <MenuToggleIcon open={open} />
    </button>
  );
}

function MobileMenuPanel({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <nav
      className={`overflow-hidden border-zinc-100 transition-[max-height,opacity] duration-300 ease-in-out motion-reduce:transition-none sm:hidden ${
        open
          ? "max-h-[32rem] border-t opacity-100"
          : "pointer-events-none max-h-0 border-t border-transparent opacity-0"
      }`}
      aria-label="メインメニュー"
      aria-hidden={!open}
    >
      <div
        className={`flex flex-col divide-y divide-zinc-100 px-4 text-sm text-zinc-700 transition-transform duration-300 ease-in-out motion-reduce:transition-none ${
          open ? "translate-y-0" : "-translate-y-2"
        }`}
      >
        {children}
      </div>
    </nav>
  );
}

const mobileLinkClass = "py-3.5 transition-colors hover:text-zinc-900";

export function TenantAppHeader({
  tenantSlug,
  variant,
  sessionTenantSlug,
  isAdmin,
  isReadonly,
  unreadCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const toggle = () => setOpen((v) => !v);

  if (variant === "full") {
    return (
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href={`/t/${tenantSlug}/posts`}
            className="text-sm font-semibold tracking-tight text-zinc-900"
            onClick={close}
          >
            jugyoBase
          </Link>

          <nav className="hidden flex-wrap items-center gap-4 text-sm text-zinc-700 sm:flex">
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

          <MobileMenuButton open={open} onToggle={toggle} />
        </div>

        <MobileMenuPanel open={open}>
          <Link
            href={`/t/${tenantSlug}/posts`}
            onClick={close}
            className={mobileLinkClass}
          >
            事例一覧
          </Link>
          {!isReadonly ? (
            <Link
              href={`/t/${tenantSlug}/posts/new`}
              onClick={close}
              className={mobileLinkClass}
            >
              新規投稿
            </Link>
          ) : null}
          <Link
            href={`/t/${tenantSlug}/mypage`}
            onClick={close}
            className={mobileLinkClass}
          >
            マイページ
          </Link>
          <Link
            href={`/t/${tenantSlug}/summary`}
            onClick={close}
            className={mobileLinkClass}
          >
            教科別一覧
          </Link>
          {isAdmin ? (
            <Link
              href={`/t/${tenantSlug}/stats`}
              onClick={close}
              className={mobileLinkClass}
            >
              統計
            </Link>
          ) : null}
          <Link
            href={`/t/${tenantSlug}/notifications`}
            onClick={close}
            className={`flex items-center gap-2 ${mobileLinkClass}`}
          >
            <span>🔔 通知</span>
            {unreadCount > 0 ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Link>
          {isAdmin ? (
            <Link
              href={`/t/${tenantSlug}/admin/users`}
              onClick={close}
              className={`${mobileLinkClass} font-medium text-purple-700`}
            >
              管理
            </Link>
          ) : null}
          <form action={signOutFromApp} className="py-3.5">
            <button type="submit" className="text-zinc-500 hover:text-zinc-900">
              ログアウト
            </button>
          </form>
        </MobileMenuPanel>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href={`/t/${tenantSlug}/posts`}
          className="text-sm font-semibold tracking-tight text-zinc-900"
          onClick={close}
        >
          jugyoBase{" "}
          <span className="font-normal text-zinc-500">（デモ閲覧）</span>
        </Link>

        <nav className="hidden flex-wrap items-center gap-4 text-sm text-zinc-700 sm:flex">
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

        <MobileMenuButton open={open} onToggle={toggle} />
      </div>

      <MobileMenuPanel open={open}>
        <Link
          href={`/t/${tenantSlug}/posts`}
          onClick={close}
          className={mobileLinkClass}
        >
          事例一覧
        </Link>
        {sessionTenantSlug ? (
          <Link
            href={`/t/${sessionTenantSlug}/posts`}
            onClick={close}
            className={`${mobileLinkClass} text-sky-700 hover:text-sky-900`}
          >
            自分の学校へ
          </Link>
        ) : null}
        <Link
          href={`/t/${tenantSlug}/login`}
          onClick={close}
          className={mobileLinkClass}
        >
          ログイン
        </Link>
      </MobileMenuPanel>
    </header>
  );
}
