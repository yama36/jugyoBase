import { redirect } from "next/navigation";
import { resolveViewTenantId } from "@/lib/resolve-view-tenant";
import { getStats } from "@/lib/queries/stats";
import { auth } from "@/auth";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";

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

export default async function StatsPage({
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
  if (session.user.role !== "admin") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        管理者権限が必要です
      </div>
    );
  }

  const tenantId = await resolveViewTenantId(tenantSlug);
  if (!tenantId) {
    redirect(`/t/${tenantSlug}/login`);
  }

  const stats = await getStats(tenantId);

  const subjectMax = Math.max(...stats.bySubject.map((d) => d.count), 1);
  const gradeMax = Math.max(...stats.byGrade.map((d) => d.count), 1);
  const monthMax = Math.max(...stats.byMonth.map((d) => d.count), 1);
  const authorMax = Math.max(...stats.topAuthors.map((d) => d.count), 1);
  const tagMax = Math.max(...stats.topTags.map((d) => d.count), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">統計</h1>
        <p className="mt-1 text-sm text-zinc-600">
          学校全体の授業実践共有の状況を確認できます
        </p>
      </div>

      {/* サマリーカード */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="累計投稿数" value={stats.totals.total} unit="件" />
        <SummaryCard
          label="今月の投稿"
          value={stats.totals.thisMonth}
          unit="件"
        />
        <SummaryCard
          label="今月の投稿者数"
          value={stats.totals.activeAuthors}
          unit="人"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* 教科別 */}
        {stats.bySubject.length > 0 ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-zinc-800">
              教科別投稿数
            </h2>
            <p className="mb-4 text-xs text-zinc-500">授業カテゴリの投稿のみ</p>
            <BarChart
              data={stats.bySubject.map((d) => ({
                label: d.subject,
                count: d.count,
              }))}
              max={subjectMax}
            />
          </section>
        ) : null}

        {/* 学年別 */}
        {stats.byGrade.length > 0 ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-zinc-800">
              学年別投稿数
            </h2>
            <p className="mb-4 text-xs text-zinc-500">授業カテゴリの投稿のみ</p>
            <BarChart
              data={stats.byGrade.map((d) => ({
                label: d.grade,
                count: d.count,
              }))}
              max={gradeMax}
            />
          </section>
        ) : null}
      </div>

      {/* 月別推移 */}
      {stats.byMonth.length > 0 ? (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-800">
            月別投稿数（直近6か月）
          </h2>
          <BarChart
            data={stats.byMonth.map((d) => ({
              label: new Date(d.month).toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "short",
              }),
              count: d.count,
            }))}
            max={monthMax}
          />
        </section>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* アクティブな先生 */}
        {stats.topAuthors.length > 0 ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800">
              投稿数の多い先生（トップ5）
            </h2>
            <BarChart
              data={stats.topAuthors.map((d) => ({
                label: d.author?.name ?? d.author?.email ?? "不明",
                count: d.count,
              }))}
              max={authorMax}
            />
          </section>
        ) : null}

        {/* よく使われるタグ */}
        {stats.topTags.length > 0 ? (
          <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-zinc-800">
              よく使われるタグ（トップ10）
            </h2>
            <BarChart
              data={stats.topTags.map((d) => ({
                label: `#${d.name}`,
                count: d.count,
              }))}
              max={tagMax}
            />
          </section>
        ) : null}
      </div>

      {stats.totals.total === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
          まだ投稿がありません。最初の実践を共有してみましょう。
        </div>
      ) : null}
    </div>
  );
}
