import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPost } from "@/lib/queries/posts";
import { PrintButton } from "@/components/PrintButton";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import { isDemoTenantSlug } from "@/lib/demo-public";
import {
  getGradeBadgeClasses,
  getSubjectBadgeClasses,
  getUnitBadgeClasses,
} from "@/lib/subject-grade-colors";
import { getPostSectionLabels } from "@/lib/post-category";

export default async function PostPrintPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; postId: string }>;
}) {
  const { tenantSlug, postId } = await params;

  const tenantId = await resolveViewTenantId(tenantSlug);
  if (!tenantId) {
    if (!isDemoTenantSlug(tenantSlug)) {
      redirect(`/t/${tenantSlug}/login`);
    }
    notFound();
  }

  const post = await getPost(tenantId, postId);
  if (!post) notFound();

  const sectionLabels = getPostSectionLabels(post.category, post.subject);

  const contentSections = [
    { title: sectionLabels.aim, value: post.aim },
    { title: sectionLabels.reflection, value: post.reflection },
    { title: sectionLabels.flow, value: post.flow },
    { title: sectionLabels.point, value: post.point },
  ].filter((s) => s.value?.trim());

  const gradeColor = getGradeBadgeClasses(post.grade);
  const subjectColor = getSubjectBadgeClasses(post.subject);
  const unitColor = getUnitBadgeClasses(post.subject);

  return (
    <>
      {/* 印刷時に非表示になる操作バー */}
      <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 shadow-sm print:hidden">
        <span className="text-sm text-zinc-600">印刷プレビュー</span>
        <div className="flex items-center gap-3">
          <Link
            href={`/t/${tenantSlug}/posts/${postId}`}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← 詳細へ
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* 印刷コンテンツ（A4想定） */}
      <div className="mx-auto max-w-2xl space-y-6 px-8 pb-16 pt-20 print:max-w-none print:px-0 print:pt-0">
        {/* ヘッダー情報 */}
        <header className="space-y-3 border-b border-zinc-300 pb-4">
          <h1 className="text-xl font-bold text-zinc-900 print:text-black">
            {post.title?.trim() || "（無題）"}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 print:gap-3">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs print:rounded-none print:border-0 print:bg-transparent print:px-0 print:py-0 ${gradeColor.wrapper}`}
            >
              <span className={`${gradeColor.value} print:text-black`}>
                {post.grade}
              </span>
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs print:rounded-none print:border-0 print:bg-transparent print:px-0 print:py-0 ${subjectColor.wrapper}`}
            >
              <span className={`${subjectColor.value} print:text-black`}>
                {post.subject}
              </span>
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs print:rounded-none print:border-0 print:bg-transparent print:px-0 print:py-0 ${unitColor.wrapper}`}
            >
              <span className={`${unitColor.label} print:text-black`}>
                単元
              </span>
              <span className={`${unitColor.value} print:text-black`}>
                {post.unit}
              </span>
            </span>
            {post.contentItem ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-xs print:rounded-none print:border-0 print:bg-transparent print:px-0 print:py-0">
                <span className="text-zinc-500 print:text-black">内容項目</span>
                <span className="font-medium text-zinc-800 print:text-black">
                  {post.contentItem}
                </span>
              </span>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500 print:text-black">
            {post.createdAt.toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            ・ {post.author.name ?? post.author.email}
          </p>
          {post.tags.length > 0 ? (
            <p className="text-xs text-zinc-500 print:text-black">
              {post.tags.map((pt) => `#${pt.tag.name}`).join("  ")}
            </p>
          ) : null}
        </header>

        {/* コンテンツセクション */}
        {contentSections.map((section) => (
          <section key={section.title} className="space-y-2">
            <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-900 print:text-black">
              <span
                aria-hidden="true"
                className="inline-block h-4 w-1 rounded-full bg-zinc-400 print:bg-black"
              />
              {section.title}
            </h2>
            <p className="whitespace-pre-wrap text-[15px] leading-7 text-zinc-700 print:text-black">
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
