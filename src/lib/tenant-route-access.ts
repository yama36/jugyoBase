type TenantSessionUser = {
  tenantSlug?: string | null;
  tenantId?: string | null;
  id?: string | null;
};

/** URL の tenantSlug とセッションの所属が一致するときのみ true。 */
export function canAccessTenantRoute(
  session: { user?: TenantSessionUser | null } | null,
  urlTenantSlug: string,
  options?: { requireTenantId?: boolean; requireUserId?: boolean },
): boolean {
  const u = session?.user;
  if (options?.requireUserId && !u?.id) return false;
  if (!u?.tenantSlug) return false;
  if (options?.requireTenantId && !u.tenantId) return false;
  return u.tenantSlug === urlTenantSlug;
}
