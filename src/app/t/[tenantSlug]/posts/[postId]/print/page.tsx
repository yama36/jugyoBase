import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPost } from "@/app/actions/posts";
import { PrintButton } from "@/components/PrintButton";

export default async function PostPrintPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
}) {
  const { tenantSlug, postId } = await params;
  const session = await auth();

  if (!session?.user?.tenantId || session.user.tenantSlug !== tenantSlug) {
    redirect(`/t/${tenantSlug}/login`);
  }

  const post = await getPost(session.user.tenantId, postId);
  if (!post) notFound();

  const contentSections = [
    { title: "めあて", value: post.aim },
    { title: "振り返り", value: post.reflection },
    { title: "工夫した点（POINT）", value: post.point },
    { title: "授業の流れ", value: post.flow },
  ].filter((s) => s.value?.trim());

  return (
    <>
      {/* 印刷時に非表示になる操作バー */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 shadow-sm print:hidden">
        <span className="text-sm text-zinc-600">印刷プレビュー</span>
        <div className="flex items-center gap-3">
          <a
            href={`/t/${tenantSlug}/posts/${postId}`}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← 戻る
          </a>
          <PrintButton />
        </div>
      </div>

      {/* 印刷コンテンツ（A4想定） */}
      <div className="mx-auto max-w-2xl space-y-6 px-8 pb-16 pt-20 print:max-w-none print:px-0 print:pt-0">
        {/* ヘッダー情報 */}
        <header className="border-b border-zinc-300 pb-4">
          <p className="text-xs text-zinc-500">
            {post.createdAt.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            ・ {post.author.name ?? post.author.email}
          </p>
          <h1 className="mt-2 text-xl font-bold text-zinc-900">
            {post.title?.trim() || "（無題）"}
          </h1>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-600">
            <span>
              <span className="font-medium">学年:</span> {post.grade}
            </span>
            <span>
              <span className="font-medium">教科:</span> {post.subject}
            </span>
            <span>
              <span className="font-medium">単元:</span> {post.unit}
            </span>
            {post.contentItem ? (
              <span>
                <span className="font-medium">内容項目:</span>{" "}
                {post.contentItem}
              </span>
            ) : null}
          </div>
          {post.tags.length > 0 ? (
            <p className="mt-2 text-xs text-zinc-500">
              {post.tags.map((pt) => `#${pt.tag.name}`).join("  ")}
            </p>
          ) : null}
        </header>

        {/* コンテンツセクション */}
        {contentSections.map((section) => (
          <section key={section.title} className="space-y-1">
            <h2 className="text-sm font-bold text-zinc-800 print:text-black">
              {section.title}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-700 print:text-black">
              {section.value}
            </p>
          </section>
        ))}

        {/* フッター（印刷時のみ表示） */}
        <footer className="hidden border-t border-zinc-200 pt-3 text-xs text-zinc-400 print:block">
          jugyoBase ・ 印刷日:{" "}
          {new Date().toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </footer>
      </div>
    </>
  );
}
