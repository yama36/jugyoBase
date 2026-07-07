import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import { getStats } from "@/lib/queries/stats";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { categoryDisplayLabel } from "@/lib/lesson-post";
import {
  AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT,
  SUBJECT_OPTIONS,
} from "@/lib/subject-grade-options";
import { AI_ICT_CATEGORY, LEGACY_BUSINESS_IMPROVEMENT_CATEGORY } from "@/lib/post-category";
import { getSubjectBadgeClasses } from "@/lib/subject-grade-colors";
import { SchoolTreeGrowth } from "@/components/SchoolTreeGrowth";

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-zinc-900">
        {value.toLocaleString()}
        <span className="ml-1 text-base font-normal text-zinc-500">{unit}</span>
      </p>
    </div>
  );
}

function SubjectCard({
  tenantSlug,
  subject,
  count,
  thisMonth,
  authorCount,
  barPercent,
  canCreatePost,
  inviteTone,
}: {
  tenantSlug: string;
  subject: string;
  count: number;
  thisMonth: number;
  authorCount: number;
  barPercent: number;
  canCreatePost: boolean;
  inviteTone: boolean;
}) {
  const color = getSubjectBadgeClasses(subject);
  const postsHref = `/t/${tenantSlug}/posts?subject=${encodeURIComponent(subject)}`;

  const cardClass = `rounded-lg border p-4 shadow-sm transition hover:border-zinc-300 ${
    inviteTone
      ? "border-dashed border-sky-200 bg-sky-50/40"
      : "border-zinc-200 bg-white"
  }`;

  return (
    <li className={cardClass}>
      <Link href={postsHref} className="block">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${color.wrapper}`}
          >
            <span className={color.value}>{subject}</span>
          </span>
          <span className="text-lg font-semibold text-zinc-900">{count}件</span>
        </div>

        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-sky-500"
            style={{ width: `${barPercent}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
          {thisMonth > 0 ? (
            <span className="font-medium text-sky-700">+{thisMonth}件（今月）</span>
          ) : null}
          {authorCount > 0 ? <span>{authorCount}人が共有中</span> : null}
        </div>

        {count === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            まだ投稿がありません。最初の実践を共有してみませんか。
          </p>
        ) : null}
      </Link>

      {inviteTone && count === 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={postsHref}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            事例一覧を見る
          </Link>
          {canCreatePost ? (
            <Link
              href={`/t/${tenantSlug}/posts/new`}
              className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800"
            >
              新規投稿
            </Link>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

const CATEGORY_COLORS: Record<
  string,
  { wrapper: string; label: string; value: string; bar: string }
> = {
  "AI・ICT活用": {
    wrapper: "bg-violet-50 border border-violet-200",
    label: "text-violet-600",
    value: "text-violet-900 font-medium",
    bar: "bg-violet-500",
  },
};

function CategoryCard({
  tenantSlug,
  category,
  count,
  thisMonth,
  authorCount,
  barPercent,
  canCreatePost,
}: {
  tenantSlug: string;
  category: string;
  count: number;
  thisMonth: number;
  authorCount: number;
  barPercent: number;
  canCreatePost: boolean;
}) {
  const color = CATEGORY_COLORS[category] ?? {
    wrapper: "bg-zinc-100 border border-zinc-200",
    label: "text-zinc-500",
    value: "text-zinc-800 font-medium",
    bar: "bg-zinc-400",
  };
  const postsHref = `/t/${tenantSlug}/posts?category=${encodeURIComponent(category)}`;

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300">
      <Link href={postsHref} className="block">
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${color.wrapper}`}
          >
            <span className={color.value}>{categoryDisplayLabel(category)}</span>
          </span>
          <span className="text-lg font-semibold text-zinc-900">{count}件</span>
        </div>

        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${color.bar}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600">
          {thisMonth > 0 ? (
            <span className="font-medium text-sky-700">+{thisMonth}件（今月）</span>
          ) : null}
          {authorCount > 0 ? <span>{authorCount}人が共有中</span> : null}
        </div>

        {count === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            まだ投稿がありません。
          </p>
        ) : null}
      </Link>

      {count === 0 && canCreatePost ? (
        <div className="mt-3">
          <Link
            href={`/t/${tenantSlug}/posts/new`}
            className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-zinc-800"
          >
            新規投稿
          </Link>
        </div>
      ) : null}
    </li>
  );
}

export default async function SubjectSummaryPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (!canAccessTenantRoute(session, tenantSlug, { requireTenantId: true })) {
    redirect(`/t/${tenantSlug}/login`);
  }
  if (!session?.user) {
    redirect(`/t/${tenantSlug}/login`);
  }
  const tenantId = await resolveViewTenantId(tenantSlug);
  if (!tenantId) {
    redirect(`/t/${tenantSlug}/login`);
  }

  const stats = await getStats(tenantId);
  const detailBySubject = new Map(
    stats.bySubjectDetail.map((row) => [row.subject, row]),
  );
  const detailByAiIctSubject = new Map(
    stats.byAiIctSubjectDetail.map((row) => [row.subject, row]),
  );
  const detailByCategory = new Map(
    stats.byCategoryDetail.map((row) => [row.category, row]),
  );

  const knownSubjects = new Set<string>([
    AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT,
    ...SUBJECT_OPTIONS,
  ]);
  const extraSubjects = [
    ...new Set([
      ...stats.bySubjectDetail.map((row) => row.subject),
      ...stats.byAiIctSubjectDetail.map((row) => row.subject),
    ]),
  ].filter((subject) => subject.trim() !== "" && !knownSubjects.has(subject));
  const allSubjects = [
    AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT,
    ...SUBJECT_OPTIONS,
    ...extraSubjects,
  ];

  const subjectRows = allSubjects.map((subject) => {
    const lesson = detailBySubject.get(subject);
    const aiIct = detailByAiIctSubject.get(subject);
    const latestPostAt = [lesson?.latestPostAt, aiIct?.latestPostAt]
      .filter((value): value is Date => value instanceof Date)
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return {
      subject,
      count: (lesson?.count ?? 0) + (aiIct?.count ?? 0),
      thisMonth: (lesson?.thisMonth ?? 0) + (aiIct?.thisMonth ?? 0),
      authorCount: (lesson?.authorCount ?? 0) + (aiIct?.authorCount ?? 0),
      latestPostAt,
    };
  });

  const aiIctCategoryDetail = detailByCategory.get(AI_ICT_CATEGORY);
  const legacyBusinessDetail = detailByCategory.get(
    LEGACY_BUSINESS_IMPROVEMENT_CATEGORY,
  );
  const aiIctTotal = {
    count:
      (aiIctCategoryDetail?.count ?? 0) + (legacyBusinessDetail?.count ?? 0),
    thisMonth:
      (aiIctCategoryDetail?.thisMonth ?? 0) +
      (legacyBusinessDetail?.thisMonth ?? 0),
    authorCount:
      (aiIctCategoryDetail?.authorCount ?? 0) +
      (legacyBusinessDetail?.authorCount ?? 0),
  };

  const maxSubjectCount = Math.max(...subjectRows.map((r) => r.count), 1);
  const subjectsWithPosts = subjectRows.filter((r) => r.count > 0).length;

  const inviteSubjects = subjectRows.filter((r) => r.count === 0);
  const growingSubjects = subjectRows
    .filter((r) => r.count > 0)
    .sort((a, b) => {
      const aTime = a.latestPostAt?.getTime() ?? 0;
      const bTime = b.latestPostAt?.getTime() ?? 0;
      return bTime - aTime;
    });

  const canCreatePost =
    session.user.tenantSlug === tenantSlug &&
    !!session.user.tenantId &&
    session.user.role !== "readonly";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">教科別の共有マップ</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          いま校内でどの教科に知見が集まっているかが一目でわかります。まだ少ない教科こそ、あなたの1件が次のヒントになります。
        </p>
      </div>

      <SchoolTreeGrowth total={stats.totals.total} />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="累計投稿数" value={stats.totals.total} unit="件" />
        <SummaryCard label="今月の投稿" value={stats.totals.thisMonth} unit="件" />
        <SummaryCard label="共有のある教科" value={subjectsWithPosts} unit="教科" />
      </div>

      {stats.totals.total === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          まだ投稿がありません。最初の実践を共有してみましょう。
          {canCreatePost ? (
            <Link
              href={`/t/${tenantSlug}/posts/new`}
              className="mt-4 block font-medium text-sky-700 hover:underline"
            >
              新規投稿へ
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-zinc-800">
              {categoryDisplayLabel(AI_ICT_CATEGORY)}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              <CategoryCard
                tenantSlug={tenantSlug}
                category={AI_ICT_CATEGORY}
                count={aiIctTotal.count}
                thisMonth={aiIctTotal.thisMonth}
                authorCount={aiIctTotal.authorCount}
                barPercent={100}
                canCreatePost={canCreatePost}
              />
            </ul>
          </section>

          {growingSubjects.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-800">教科別</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {growingSubjects.map((row) => (
                  <SubjectCard
                    key={row.subject}
                    tenantSlug={tenantSlug}
                    subject={row.subject}
                    count={row.count}
                    thisMonth={row.thisMonth}
                    authorCount={row.authorCount}
                    barPercent={
                      maxSubjectCount > 0 ? (row.count / maxSubjectCount) * 100 : 0
                    }
                    canCreatePost={canCreatePost}
                    inviteTone={false}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {inviteSubjects.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-800">
                いま声を届けたい教科
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {inviteSubjects.map((row) => (
                  <SubjectCard
                    key={row.subject}
                    tenantSlug={tenantSlug}
                    subject={row.subject}
                    count={row.count}
                    thisMonth={row.thisMonth}
                    authorCount={row.authorCount}
                    barPercent={
                      maxSubjectCount > 0 ? (row.count / maxSubjectCount) * 100 : 0
                    }
                    canCreatePost={canCreatePost}
                    inviteTone
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
