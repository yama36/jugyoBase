import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { listPostSearchOptions, listPosts } from "@/app/actions/posts";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import { withBasePath } from "@/lib/app-base-path";
import {
  getGradeBadgeClasses,
  NEUTRAL_BADGE_CLASSES,
  getSubjectBadgeClasses,
  getUnitBadgeClasses,
} from "@/lib/subject-grade-colors";

export default async function PostsPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { tenantSlug } = await params;
  const sp = await searchParams;
  const session = await auth();
  const tenantId = await resolveViewTenantId(tenantSlug);
  if (!tenantId) {
    notFound();
  }

  const canCreatePost =
    session?.user?.tenantSlug === tenantSlug &&
    !!session.user.tenantId &&
    session.user.role !== "readonly";

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const grade = typeof sp.grade === "string" ? sp.grade : undefined;
  const subject = typeof sp.subject === "string" ? sp.subject : undefined;
  const unit = typeof sp.unit === "string" ? sp.unit : undefined;
  const tag = typeof sp.tag === "string" ? sp.tag : undefined;

  const [posts, options] = await Promise.all([
    listPosts(tenantId, {
      q,
      grade,
      subject,
      unit,
      tag,
    }),
    listPostSearchOptions(tenantId),
  ]);
  const hasSearchParams = Boolean(q || grade || subject || unit || tag);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">授業実践</h1>
          <p className="mt-1 text-sm text-zinc-600">
            AIを特別なものにせず、日々の授業準備・実践で使い、校内で知見を共有していきましょう。
          </p>
        </div>
        {canCreatePost ? (
          <Link
            href={`/t/${tenantSlug}/posts/new`}
            className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            新規投稿
          </Link>
        ) : null}
      </div>

      <details
        open={hasSearchParams}
        className="group rounded-lg border border-zinc-200 bg-white"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50">
          <span className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
              className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-90"
            >
              <path
                fillRule="evenodd"
                d="M7.21 5.21a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.08l-4.25 4.25a.75.75 0 11-1.06-1.06L10.94 10 7.21 6.27a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
            検索条件
            {hasSearchParams ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">
                条件あり
              </span>
            ) : null}
          </span>
          <span className="text-xs text-zinc-500">
            <span className="group-open:hidden">開く</span>
            <span className="hidden group-open:inline">閉じる</span>
          </span>
        </summary>
        <form method="get" className="grid gap-3 border-t border-zinc-200 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600">キーワード</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="本文・タイトル・単元など"
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">学年</label>
            <select
              name="grade"
              defaultValue={grade ?? ""}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">指定なし</option>
              {options.grades.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">教科</label>
            <select
              name="subject"
              defaultValue={subject ?? ""}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
            >
              <option value="">指定なし</option>
              {options.subjects.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">単元（部分一致）</label>
            <input
              name="unit"
              defaultValue={unit}
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-600">タグ</label>
            <input
              name="tag"
              list="tag-suggestions"
              defaultValue={tag}
              placeholder="例: 協同学習"
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            />
            <datalist id="tag-suggestions">
              {options.tags.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              検索
            </button>
            <Link
              href={`/t/${tenantSlug}/posts`}
              className="text-sm text-zinc-600 underline-offset-2 hover:underline"
            >
              条件クリア
            </Link>
          </div>
        </form>
      </details>

      <ul className="space-y-3">
        {posts.length === 0 ? (
          <li className="rounded border border-dashed border-zinc-300 bg-white p-6 text-center text-sm text-zinc-600">
            まだ投稿がありません
          </li>
        ) : (
          posts.map((post) => {
            const attachments = (post as unknown as {
              attachments?: {
                id: string;
                kind: "image" | "pdf" | "slide" | "video";
                originalFilename: string;
                malwareScanStatus: "pending" | "clean" | "infected" | "error";
              }[];
            }).attachments ?? [];
            const imageAttachment = attachments.find(
              (a) => a.kind === "image" && a.malwareScanStatus === "clean",
            );
            const pdfAttachment = attachments.find(
              (a) => a.kind === "pdf" && a.malwareScanStatus === "clean",
            );
            const thumbAttachment = imageAttachment ?? pdfAttachment ?? null;
            const thumbHref = thumbAttachment
              ? withBasePath(`/t/${tenantSlug}/files/${thumbAttachment.id}`)
              : null;
            const gradeColor = getGradeBadgeClasses(post.grade);
            const subjectColor = getSubjectBadgeClasses(post.subject);
            const unitColor = getUnitBadgeClasses(post.subject);
            const categoryColor = NEUTRAL_BADGE_CLASSES;

            return (
              <li key={post.id}>
                <Link
                  href={`/t/${tenantSlug}/posts/${post.id}`}
                  className="block rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300"
                >
                  <div className="flex gap-4">
                    {thumbAttachment ? (
                      <div className="h-24 w-24 shrink-0 overflow-hidden rounded border border-zinc-200 bg-zinc-50">
                        {thumbAttachment.kind === "image" && thumbHref ? (
                          <Image
                            src={`${thumbHref}?thumb=1`}
                            alt={thumbAttachment.originalFilename}
                            width={96}
                            height={96}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center text-[11px] text-zinc-600">
                            <span className="rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">
                              PDF
                            </span>
                            <span className="mt-1 px-1 text-center leading-tight">
                              サムネイル
                            </span>
                          </div>
                        )}
                      </div>
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="font-medium text-zinc-900">
                          {post.title?.trim() || "（無題）"}
                        </h2>
                        <time
                          dateTime={post.createdAt.toISOString()}
                          className="text-xs text-zinc-500"
                        >
                          {post.createdAt.toLocaleDateString("ja-JP")}
                        </time>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${gradeColor.wrapper}`}
                        >
                          <span className={gradeColor.value}>{post.grade}</span>
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${subjectColor.wrapper}`}
                        >
                          <span className={subjectColor.value}>
                            {post.subject}
                          </span>
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${categoryColor.wrapper}`}
                        >
                          <span className={categoryColor.label}>カテゴリ</span>
                          <span className={categoryColor.value}>
                            {post.category ?? "授業"}
                          </span>
                        </span>
                        {(post as { hasCurriculumUnitOptions?: boolean }).hasCurriculumUnitOptions ? (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${unitColor.wrapper}`}
                          >
                            <span className={unitColor.label}>単元</span>
                            <span className={unitColor.value}>{post.unit}</span>
                          </span>
                        ) : null}
                        {post.contentItem ? (
                          <span className="text-xs text-zinc-500">
                            {post.contentItem}
                          </span>
                        ) : null}
                      </div>
                      {post.tags.length > 0 ? (
                        <p className="mt-2 text-xs text-sky-700">
                          {(post as unknown as { tags: { tag: { name: string } }[] }).tags
                            .map((pt) => `#${pt.tag.name}`)
                            .join(" ")}
                        </p>
                      ) : null}
                      <div className="mt-2 flex items-center gap-3 text-xs text-zinc-400">
                        <span>♥ {(post as any)._count?.likes ?? 0}</span>
                        <span>💬 {(post as any)._count?.comments ?? 0}</span>
                        {thumbAttachment ? (
                          <span className="text-zinc-500">
                            添付: {thumbAttachment.kind === "image" ? "画像" : "PDF"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
