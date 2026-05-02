type TenantSessionUser = {
  tenantSlug?: string | null;
  tenantId?: string | null;
  id?: string | null;
};

/**
 * テナント付きルートへのアクセス可否。
 * 本番: URL の tenantSlug とセッションが一致するときのみ true。
 * 開発: ログイン済みなら URL のテナントを跨いでも true（demo の画面確認用）。
 */
export function canAccessTenantRoute(
  session: { user?: TenantSessionUser | null } | null,
  urlTenantSlug: string,
  options?: { requireTenantId?: boolean; requireUserId?: boolean },
): boolean {
  const u = session?.user;
  if (options?.requireUserId && !u?.id) return false;
  if (!u?.tenantSlug) return false;
  if (options?.requireTenantId && !u.tenantId) return false;
  if (process.env.NODE_ENV !== "production") return true;
  return u.tenantSlug === urlTenantSlug;
}
