import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { withTenantRls } from "@/lib/prisma-tenant";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminExportPage({
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

  const exportCount = await withTenantRls(session.user.tenantId, (tx) =>
    tx.post.count({
      where: { isAiIctLesson: true, isPublished: true },
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">管理</h1>
        <AdminNav tenantSlug={tenantSlug} active="export" />
      </div>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            AI/ICT活用授業アンケートのエクスポート
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            「授業」カテゴリで AI/ICT 活用フラグが ON の公開済み投稿を CSV でダウンロードできます。
            アンケート回答は教員には公開されず、研究分析用として管理者のみが取得できます。
          </p>
        </div>

        <dl className="grid gap-2 rounded-lg border border-zinc-100 bg-zinc-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">エクスポート対象</dt>
            <dd className="font-medium text-zinc-900">{exportCount} 件</dd>
          </div>
          <div>
            <dt className="text-zinc-500">対象外</dt>
            <dd className="text-zinc-700">下書き・フラグ OFF・既存の振り返りなし投稿</dd>
          </div>
        </dl>

        <a
          href={`/t/${tenantSlug}/admin/export/download`}
          className="inline-flex rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          CSVをダウンロード
        </a>
      </section>
    </div>
  );
}
