import { redirect } from "next/navigation";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import Link from "next/link";
import { auth } from "@/auth";
import {
  listCurriculumUnits,
  addCurriculumUnit,
  toggleCurriculumUnitActive,
} from "@/app/actions/admin";

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  junior_high: "中学校",
  elementary: "小学校",
  high_school: "高校",
  special: "特別支援",
};

export default async function AdminCurriculumPage({
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

  const units = await listCurriculumUnits();

  // subject > grade でグループ化
  const grouped = units.reduce<Record<string, typeof units>>((acc, u) => {
    const key = `${u.subject}__${u.grade}`;
    (acc[key] ??= []).push(u);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">管理</h1>
        <nav className="mt-2 flex gap-4 text-sm">
          <Link
            href={`/t/${tenantSlug}/admin/users`}
            className="text-zinc-500 hover:text-zinc-800"
          >
            ユーザー管理
          </Link>
          <span className="font-medium text-zinc-900 underline underline-offset-4">
            単元マスタ
          </span>
          <Link
            href={`/t/${tenantSlug}/admin/settings`}
            className="text-zinc-500 hover:text-zinc-800"
          >
            学校設定
          </Link>
        </nav>
      </div>

      {/* 追加フォーム */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-800">単元を追加</h2>
        <p className="mt-1 text-xs text-zinc-500">
          投稿フォームの単元候補に追加されます。
        </p>
        <form
          action={async (fd) => {
            await addCurriculumUnit(fd);
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <input type="hidden" name="schoolType" value="junior_high" />
          <div>
            <label className="block text-xs font-medium text-zinc-600">教科 *</label>
            <input
              name="subject"
              type="text"
              required
              placeholder="数学"
              className="mt-1 w-24 rounded border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">学年 *</label>
            <select
              name="grade"
              required
              className="mt-1 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="">選択</option>
              <option value="1年">1年</option>
              <option value="2年">2年</option>
              <option value="3年">3年</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">単元名 *</label>
            <input
              name="name"
              type="text"
              required
              placeholder="比例と反比例"
              className="mt-1 w-48 rounded border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">カテゴリ（任意）</label>
            <input
              name="category"
              type="text"
              placeholder="数と計算"
              className="mt-1 w-32 rounded border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            追加
          </button>
        </form>
      </section>

      {/* 単元一覧 */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([key, groupUnits]) => {
          const [subject, grade] = key.split("__");
          return (
            <section
              key={key}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2">
                <h3 className="text-sm font-semibold text-zinc-800">
                  {subject} / {grade}
                </h3>
              </div>
              <ul className="divide-y divide-zinc-100">
                {groupUnits.map((unit) => (
                  <li
                    key={unit.id}
                    className={`flex items-center justify-between px-4 py-2.5 ${
                      unit.isActive ? "" : "opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-zinc-800">{unit.name}</span>
                      {unit.category ? (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500">
                          {unit.category}
                        </span>
                      ) : null}
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-400">
                        {SCHOOL_TYPE_LABELS[unit.schoolType] ?? unit.schoolType}
                      </span>
                    </div>
                    <form
                      action={async () => {
                        await toggleCurriculumUnitActive(
                          tenantSlug,
                          unit.id,
                          !unit.isActive,
                        );
                      }}
                    >
                      <button
                        type="submit"
                        className={`rounded border px-2.5 py-1 text-xs transition ${
                          unit.isActive
                            ? "border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-600"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {unit.isActive ? "無効化" : "有効化"}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">
            単元データがありません。上のフォームから追加してください。
          </div>
        ) : null}
      </div>
    </div>
  );
}
