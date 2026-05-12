import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user?.tenantSlug) {
    redirect(`/t/${session.user.tenantSlug}/posts`);
  }

  const tenants = await prisma.tenant.findMany({
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          jugyoBase
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          学校（テナント）を選んでログインします。
        </p>
      </div>
      {tenants.length === 0 ? (
        <p className="text-sm text-zinc-500">
          登録された学校がありません。運用者向けの作成手順はリポジトリの{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs">
            docs/TENANT_BOOTSTRAP.md
          </code>{" "}
          を参照してください。
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          {tenants.map((t) => (
            <li key={t.slug}>
              <Link
                href={`/t/${t.slug}/login`}
                className="block px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              >
                {t.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
