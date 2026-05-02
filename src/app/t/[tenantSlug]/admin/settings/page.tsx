import { redirect } from "next/navigation";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import Link from "next/link";
import { auth } from "@/auth";
import { getTenantSettings, updateTenantSettings } from "@/app/actions/admin";

const SCHOOL_TYPE_OPTIONS = [
  { value: "elementary", label: "小学校" },
  { value: "middle", label: "中学校" },
  { value: "high", label: "高校" },
  { value: "special", label: "特別支援学校" },
] as const;

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
] as const;

export default async function AdminSettingsPage({
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

  const tenant = await getTenantSettings(session.user.tenantId);
  if (!tenant) redirect(`/t/${tenantSlug}/posts`);

  const currentSchoolType = (tenant as any).schoolType ?? "elementary";
  const currentPrefecture = (tenant as any).prefecture ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">管理</h1>
        <nav className="mt-2 flex gap-4 text-sm">
          <Link href={`/t/${tenantSlug}/admin/users`} className="text-zinc-500 hover:text-zinc-800">
            ユーザー管理
          </Link>
          <Link href={`/t/${tenantSlug}/admin/curriculum`} className="text-zinc-500 hover:text-zinc-800">
            単元マスタ
          </Link>
          <span className="font-medium text-zinc-900 underline underline-offset-4">
            学校設定
          </span>
        </nav>
      </div>

      <form
        action={async (fd) => {
          await updateTenantSettings(fd);
        }}
        className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="tenantSlug" value={tenantSlug} />

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            学校名 <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            defaultValue={tenant.name}
            className="mt-1.5 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">学校種別</label>
          <select
            name="schoolType"
            defaultValue={currentSchoolType}
            className="mt-1.5 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none"
          >
            {SCHOOL_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">都道府県</label>
          <select
            name="prefecture"
            defaultValue={currentPrefecture}
            className="mt-1.5 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">未設定</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Googleドメイン制限
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            設定すると、このドメインのGoogleアカウントのみログイン可能になります（例: school.example.jp）
          </p>
          <input
            name="googleHostedDomain"
            type="text"
            defaultValue={tenant.googleHostedDomain ?? ""}
            placeholder="school.example.jp"
            className="mt-1.5 w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          保存する
        </button>
      </form>
    </div>
  );
}
