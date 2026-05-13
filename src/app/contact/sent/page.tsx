import type { Metadata } from "next";
import Link from "next/link";
import { SentSuccessToast } from "@/components/contact/SentSuccessToast";

export const metadata: Metadata = {
  title: "送信しました — jugyoBase",
  description: "お問い合わせを受け付けました",
};

export default function ContactSentPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SentSuccessToast />
      <div className="rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-sky-700">Contact</p>
        <h1 className="mt-3 text-xl font-semibold text-zinc-900">送信しました</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          お問い合わせを受け付けました。内容を確認のうえ、必要に応じてご登録のメールアドレスへご連絡します。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact"
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            フォームに戻る
          </Link>
          <Link
            href="/help"
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            使い方を見る
          </Link>
          <Link href="/" className="rounded-lg px-4 py-2 text-sm text-sky-700 hover:underline">
            トップへ
          </Link>
        </div>
      </div>
    </div>
  );
}
