import type { Metadata } from "next";
import { auth } from "@/auth";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "お問い合わせ — jugyoBase",
  description: "jugyoBase に関する不具合・お問い合わせ・機能要望の送信フォーム",
};

export default async function ContactPage() {
  const session = await auth();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 lg:py-12">
      <header className="border-b border-zinc-200 pb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-sky-700">Contact</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          お問い合わせ
        </h1>
        <p className="mt-3 text-sm leading-7 text-zinc-600">
          不具合のご報告、ご質問、機能のご要望はこちらから送信できます。ログインの有無にかかわらずご利用いただけます。
        </p>
      </header>

      <div className="mt-8">
        <ContactForm
          defaultName={session?.user?.name}
          defaultEmail={session?.user?.email}
        />
      </div>
    </div>
  );
}
