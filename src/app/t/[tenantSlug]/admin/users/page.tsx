import { redirect } from "next/navigation";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import Link from "next/link";
import { auth } from "@/auth";
import { listTenantUsers, addUser, updateUserRole } from "@/app/actions/admin";
import { RemoveUserButton } from "@/components/RemoveUserButton";

const ROLE_LABELS: Record<string, string> = {
  admin: "管理者",
  teacher: "教員",
  readonly: "閲覧専用",
};

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 border-purple-200",
  teacher: "bg-green-100 text-green-800 border-green-200",
  readonly: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export default async function AdminUsersPage({
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

  const users = await listTenantUsers(session.user.tenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">管理</h1>
        <nav className="mt-2 flex gap-4 text-sm">
          <span className="font-medium text-zinc-900 underline underline-offset-4">
            ユーザー管理
          </span>
          <Link
            href={`/t/${tenantSlug}/admin/curriculum`}
            className="text-zinc-500 hover:text-zinc-800"
          >
            単元マスタ
          </Link>
          <Link
            href={`/t/${tenantSlug}/admin/settings`}
            className="text-zinc-500 hover:text-zinc-800"
          >
            学校設定
          </Link>
        </nav>
      </div>

      {/* 招待フォーム */}
      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-800">ユーザーを追加</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Googleアカウントのメールアドレスを登録すると、ログインできるようになります。
        </p>
        <form
          action={async (fd) => {
            await addUser(fd);
          }}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <div>
            <label className="block text-xs font-medium text-zinc-600">メールアドレス *</label>
            <input
              name="email"
              type="email"
              required
              placeholder="teacher@school.example"
              className="mt-1 rounded border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">名前（任意）</label>
            <input
              name="name"
              type="text"
              placeholder="山田 太郎"
              className="mt-1 rounded border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600">ロール</label>
            <select
              name="role"
              defaultValue="teacher"
              className="mt-1 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm focus:outline-none"
            >
              <option value="teacher">教員</option>
              <option value="admin">管理者</option>
              <option value="readonly">閲覧専用</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            追加
          </button>
        </form>
      </section>

      {/* ユーザー一覧 */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">名前 / メール</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">現在のロール</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-600">ロール変更</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.map((user) => {
              const isSelf = user.id === session.user.id;
              return (
                <tr key={user.id} className={isSelf ? "bg-zinc-50" : ""}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900">
                      {user.name ?? "（名前未設定）"}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-zinc-400">（自分）</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? ROLE_BADGE.teacher}`}
                    >
                      {ROLE_LABELS[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs text-zinc-400">変更不可</span>
                    ) : (
                      <form
                        action={async (fd) => {
                          await updateUserRole(fd);
                        }}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="tenantSlug" value={tenantSlug} />
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800 focus:outline-none"
                        >
                          <option value="teacher">教員</option>
                          <option value="admin">管理者</option>
                          <option value="readonly">閲覧専用</option>
                        </select>
                        <button
                          type="submit"
                          className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs hover:bg-zinc-50"
                        >
                          変更
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isSelf ? null : (
                      <RemoveUserButton tenantSlug={tenantSlug} userId={user.id} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
