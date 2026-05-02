import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isDemoTenantSlug } from "@/lib/demo-public";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";

/**
 * 事例一覧・詳細など閲覧用の tenantId。
 * demo は URL に合わせ常に DB の demo テナント（未ログイン可）。
 * それ以外はログインユーザーの所属テナント。
 */
export async function resolveViewTenantId(tenantSlug: string): Promise<string | null> {
  if (isDemoTenantSlug(tenantSlug)) {
    const t = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    return t?.id ?? null;
  }
  const session = await auth();
  if (!session?.user?.tenantId) return null;
  if (!canAccessTenantRoute(session, tenantSlug, { requireTenantId: true })) {
    return null;
  }
  return session.user.tenantId;
}
