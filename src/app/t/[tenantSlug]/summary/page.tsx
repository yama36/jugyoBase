import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import { getStats } from "@/app/actions/stats";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { COMMON_GRADE_SUBJECT_LABEL, SUBJECT_OPTIONS } from "@/lib/subject-grade-options";
import { getSubjectBadgeClasses } from "@/lib/subject-grade-colors";

function BarChart({
  data,
  max,
}: {
  data: { label: string; count: number }[];
  max: number;
}) {
  return (
    <ul className="space-y-2">
      {data.map((item) => (
        <li key={item.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-right text-sm text-zinc-600">
            {item.label}
          </span>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-zinc-100">
            <div
              className="absolute left-0 top-0 h-full rounded bg-sky-500 transition-all"
              style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-right text-sm font-medium text-zinc-700">
            {item.count}
          </span>
        </li>
      ))}
    </ul>
  );
}

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
            まだ投稿がありません。最初の実践やAI活用を共有してみませんか。
          </p>
        ) : count === 1 ? (
          <p className="mt-3 text-sm text-zinc-600">
            あと1件で、仲間の参考が増えます。
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

  const subjects = SUBJECT_OPTIONS.filter((s) => s !== COMMON_GRADE_SUBJECT_LABEL);
  const subjectRows = subjects.map((subject) => {
    const detail = detailBySubject.get(subject);
    return {
      subject,
      count: detail?.count ?? 0,
      thisMonth: detail?.thisMonth ?? 0,
      authorCount: detail?.authorCount ?? 0,
    };
  });

  const maxCount = Math.max(...subjectRows.map((r) => r.count), 1);
  const subjectsWithPosts = subjectRows.filter((r) => r.count > 0).length;

  const inviteSubjects = subjectRows.filter((r) => r.count <= 1);
  const growingSubjects = subjectRows.filter((r) => r.count > 1);

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
                    barPercent={maxCount > 0 ? (row.count / maxCount) * 100 : 0}
                    canCreatePost={canCreatePost}
                    inviteTone
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {growingSubjects.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-zinc-800">みんなの共有</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {growingSubjects.map((row) => (
                  <SubjectCard
                    key={row.subject}
                    tenantSlug={tenantSlug}
                    subject={row.subject}
                    count={row.count}
                    thisMonth={row.thisMonth}
                    authorCount={row.authorCount}
                    barPercent={maxCount > 0 ? (row.count / maxCount) * 100 : 0}
                    canCreatePost={canCreatePost}
                    inviteTone={false}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800">教科別投稿数</h2>
            <BarChart
              data={subjectRows.map((r) => ({ label: r.subject, count: r.count }))}
              max={maxCount}
            />
          </section>
        </>
      )}
    </div>
  );
}
