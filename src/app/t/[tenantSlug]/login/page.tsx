import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { loginWithTenantForm } from "@/app/actions/auth";

export default async function TenantLoginPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  if (session?.user?.tenantSlug === tenantSlug) {
    redirect(`/t/${tenantSlug}/posts`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">ログイン</h1>
        <p className="mt-2 text-sm text-zinc-600">
          学校テナント: <span className="font-mono">{tenantSlug}</span>
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          運用で事前登録された Google アカウントのみログインできます。
        </p>
      </div>
      <form action={loginWithTenantForm} className="space-y-4">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-zinc-50"
        >
          Google で続行
        </button>
      </form>
      <p className="text-xs text-zinc-500">
        <Link href="/" className="underline-offset-2 hover:underline">
          トップへ戻る
        </Link>
      </p>
    </div>
  );
}
