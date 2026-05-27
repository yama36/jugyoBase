import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import { getStats } from "@/app/actions/stats";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { SUBJECT_OPTIONS } from "@/lib/subject-grade-options";
import { getSubjectBadgeClasses } from "@/lib/subject-grade-colors";

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
  const countBySubject = new Map(stats.bySubject.map((row) => [row.subject, row.count]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">教科別記事数</h1>
        <p className="mt-1 text-sm text-zinc-600">教科ごとの投稿状況を一覧できます。</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SUBJECT_OPTIONS.filter((subject) => subject !== "共通").map((subject) => {
          const count = countBySubject.get(subject) ?? 0;
          const color = getSubjectBadgeClasses(subject);
          return (
            <li key={subject}>
              <Link
                href={`/t/${tenantSlug}/posts?subject=${encodeURIComponent(subject)}`}
                className={`block rounded-lg border p-4 shadow-sm transition hover:border-zinc-300 ${count === 0 ? "border-zinc-200 bg-zinc-50 opacity-70" : "border-zinc-200 bg-white"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${color.wrapper}`}
                  >
                    <span className={color.value}>{subject}</span>
                  </span>
                  <span className="text-lg font-semibold text-zinc-900">{count}件</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
