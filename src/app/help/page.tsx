import type { Metadata } from "next";
import Overview from "./_content/overview.mdx";
import GettingStarted from "./_content/getting-started.mdx";
import CreatePost from "./_content/create-post.mdx";
import Browse from "./_content/browse.mdx";
import Interact from "./_content/interact.mdx";
import MyPage from "./_content/mypage.mdx";
import Policy from "./_content/policy.mdx";
import Faq from "./_content/faq.mdx";
import { Toc, type TocItem } from "./Toc";

export const metadata: Metadata = {
  title: "使い方 — jugyoBase",
  description: "jugyoBase の基本的な使い方、投稿・検索・通知・運用上の注意をまとめたヘルプページ。",
};

const TOC: TocItem[] = [
  { id: "overview", label: "jugyoBase とは" },
  { id: "getting-started", label: "はじめての方へ" },
  { id: "create-post", label: "授業実践を投稿する" },
  { id: "browse", label: "事例を探す" },
  { id: "interact", label: "コメント・通知" },
  { id: "mypage", label: "マイページとプロフィール" },
  { id: "policy", label: "利用上の注意" },
  { id: "faq", label: "よくある質問" },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block">
          <Toc items={TOC} />
        </aside>
        <article>
          <header className="border-b border-zinc-200 pb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-sky-700">
              Help
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
              使い方
            </h1>
            <p className="mt-3 text-sm leading-7 text-zinc-600">
              jugyoBase
              の基本的な使い方をまとめました。はじめてご利用いただく方は、
              <a
                href="#getting-started"
                className="text-sky-700 underline-offset-2 hover:underline"
              >
                「はじめての方へ」
              </a>
              から順にお読みください。
            </p>
          </header>

          {/* モバイル向けの簡易インデックス（PC では右サイドの追従 TOC を使用） */}
          <nav
            aria-label="目次（モバイル）"
            className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 lg:hidden"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              目次
            </p>
            <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm sm:grid-cols-2">
              {TOC.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block rounded px-2 py-1 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-8 space-y-8">
            <section>
              <Overview />
            </section>
            <section>
              <GettingStarted />
            </section>
            <section>
              <CreatePost />
            </section>
            <section>
              <Browse />
            </section>
            <section>
              <Interact />
            </section>
            <section>
              <MyPage />
            </section>
            <section>
              <Policy />
            </section>
            <section>
              <Faq />
            </section>
          </div>

          <footer className="mt-16 border-t border-zinc-200 pt-6 text-sm text-zinc-500">
            <p>
              ご不明点や運用ルールの追加は、校内の管理担当者にお問い合わせください。
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
