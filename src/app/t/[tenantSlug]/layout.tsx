import { PublicSiteFooter } from "@/components/site/PublicSiteFooter";
import { TenantAppHeader } from "@/components/site/TenantAppHeader";
import { auth } from "@/auth";
import { getUnreadCount } from "@/lib/queries/notifications";
import { isDemoTenantSlug } from "@/lib/demo-public";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();
  const sessionMatchesUrl =
    session?.user?.tenantSlug === tenantSlug && !!session.user.tenantId;
  const showFullNav = sessionMatchesUrl;

  const showPublicDemoHeader =
    isDemoTenantSlug(tenantSlug) && !sessionMatchesUrl;

  const isAdmin = session?.user?.role === "admin";
  const isReadonly = session?.user?.role === "readonly";

  let unreadCount = 0;
  if (showFullNav && session?.user?.id) {
    try {
      unreadCount = await getUnreadCount(session.user.id);
    } catch {
      // 通知テーブル未作成時はスキップ
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      {showFullNav ? (
        <TenantAppHeader
          tenantSlug={tenantSlug}
          variant="full"
          isAdmin={!!isAdmin}
          isReadonly={!!isReadonly}
          unreadCount={unreadCount}
        />
      ) : showPublicDemoHeader ? (
        <TenantAppHeader
          tenantSlug={tenantSlug}
          variant="demo"
          sessionTenantSlug={session?.user?.tenantSlug}
          isAdmin={false}
          isReadonly={false}
          unreadCount={0}
        />
      ) : null}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
      <PublicSiteFooter />
    </div>
  );
}
