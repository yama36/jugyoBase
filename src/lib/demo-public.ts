/** URL 上のデモテナント（ログインなしで事例一覧・詳細を閲覧可能） */
export const DEMO_TENANT_SLUG = "demo";

export function isDemoTenantSlug(slug: string): boolean {
  return slug === DEMO_TENANT_SLUG;
}
