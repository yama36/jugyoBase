import type { MDXComponents } from "mdx/types";
import { HelpMock } from "@/app/help/HelpMock";

/**
 * /help ページ用の MDX コンポーネントマップ。
 * Tailwind v4 の typography プラグインは導入していないため、
 * h1〜h3、段落、リスト、コードに最低限のクラスを当てる。
 *
 * App Router で `@next/mdx` を使うには、本ファイルがプロジェクトルート
 * （src/ あり構成では src/ 直下）に存在することが必須。
 * @see node_modules/next/dist/docs/01-app/02-guides/mdx.md
 */
const components: MDXComponents = {
  h1: ({ children, id }) => (
    <h1
      id={id}
      className="scroll-mt-24 text-2xl font-semibold tracking-tight text-zinc-900"
    >
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2
      id={id}
      className="mt-10 scroll-mt-24 border-b border-zinc-200 pb-2 text-xl font-semibold text-zinc-900"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3
      id={id}
      className="mt-6 scroll-mt-24 text-base font-semibold text-zinc-800"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mt-3 text-[15px] leading-7 text-zinc-700">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 list-disc space-y-1 pl-6 text-[15px] leading-7 text-zinc-700">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 list-decimal space-y-1 pl-6 text-[15px] leading-7 text-zinc-700">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="marker:text-zinc-400">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      className="text-sky-700 underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px] text-zinc-800">
      {children}
    </code>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-900">{children}</strong>
  ),
  hr: () => <hr className="my-8 border-zinc-200" />,
  blockquote: ({ children }) => (
    <blockquote className="mt-4 rounded-r border-l-4 border-zinc-300 bg-zinc-50 px-4 py-2 text-sm text-zinc-700">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-zinc-300 bg-zinc-50 text-left text-zinc-700">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-700">
      {children}
    </td>
  ),
  HelpMock,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
