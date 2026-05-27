"use client";

import { useState } from "react";
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

function HamburgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}

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

          {/* デスクトップ横並びナビ */}
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

          {/* モバイル：ハンバーガーボタン */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 sm:hidden"
            aria-label={open ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={open}
          >
            {open ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>

        {/* モバイルドロップダウンメニュー */}
        {open ? (
          <nav
            className="border-t border-zinc-100 sm:hidden"
            aria-label="メインメニュー"
          >
            <div className="flex flex-col divide-y divide-zinc-100 px-4 text-sm text-zinc-700">
              <Link
                href={`/t/${tenantSlug}/posts`}
                onClick={close}
                className="py-3 hover:text-zinc-900"
              >
                事例一覧
              </Link>
              {!isReadonly ? (
                <Link
                  href={`/t/${tenantSlug}/posts/new`}
                  onClick={close}
                  className="py-3 hover:text-zinc-900"
                >
                  新規投稿
                </Link>
              ) : null}
              <Link
                href={`/t/${tenantSlug}/mypage`}
                onClick={close}
                className="py-3 hover:text-zinc-900"
              >
                マイページ
              </Link>
              <Link
                href={`/t/${tenantSlug}/summary`}
                onClick={close}
                className="py-3 hover:text-zinc-900"
              >
                教科別一覧
              </Link>
              {isAdmin ? (
                <Link
                  href={`/t/${tenantSlug}/stats`}
                  onClick={close}
                  className="py-3 hover:text-zinc-900"
                >
                  統計
                </Link>
              ) : null}
              <Link
                href={`/t/${tenantSlug}/notifications`}
                onClick={close}
                className="flex items-center gap-2 py-3 hover:text-zinc-900"
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
                  className="py-3 font-medium text-purple-700"
                >
                  管理
                </Link>
              ) : null}
              <form action={signOutFromApp} className="py-3">
                <button
                  type="submit"
                  className="text-zinc-500 hover:text-zinc-900"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </nav>
        ) : null}
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

        {/* デスクトップナビ */}
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

        {/* モバイル：ハンバーガーボタン */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded text-zinc-600 hover:bg-zinc-100 sm:hidden"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </div>

      {/* モバイルドロップダウンメニュー */}
      {open ? (
        <nav
          className="border-t border-zinc-100 sm:hidden"
          aria-label="メインメニュー"
        >
          <div className="flex flex-col divide-y divide-zinc-100 px-4 text-sm text-zinc-700">
            <Link
              href={`/t/${tenantSlug}/posts`}
              onClick={close}
              className="py-3 hover:text-zinc-900"
            >
              事例一覧
            </Link>
            {sessionTenantSlug ? (
              <Link
                href={`/t/${sessionTenantSlug}/posts`}
                onClick={close}
                className="py-3 text-sky-700 hover:text-sky-900"
              >
                自分の学校へ
              </Link>
            ) : null}
            <Link
              href={`/t/${tenantSlug}/login`}
              onClick={close}
              className="py-3"
            >
              ログイン
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
