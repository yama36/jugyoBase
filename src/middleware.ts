import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { DEMO_TENANT_SLUG } from "@/lib/demo-public";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/t/")) return NextResponse.next();

  const parts = path.split("/").filter(Boolean);
  const slug = parts[1];
  if (!slug) return NextResponse.next();

  if (path === `/t/${slug}/login` || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // demo はログインなしで閲覧可（事例一覧・詳細など）
  if (slug === DEMO_TENANT_SLUG) {
    return NextResponse.next();
  }

  if (!req.auth?.user?.tenantSlug) {
    return NextResponse.redirect(new URL(`/t/${slug}/login`, req.url));
  }

  if (req.auth.user.tenantSlug !== slug) {
    // 開発時は URL のテナントを自由に跨げる（demo のプロフィール編集など検証用）
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next();
    }
    const correctSlug = req.auth.user.tenantSlug;
    const prefix = `/t/${slug}`;
    const suffix = path.startsWith(prefix) ? path.slice(prefix.length) : "";
    const targetPath =
      suffix === "" || suffix.startsWith("/")
        ? `/t/${correctSlug}${suffix}`
        : `/t/${correctSlug}/${suffix}`;
    return NextResponse.redirect(new URL(targetPath, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/t/:tenantSlug/:path*"],
};
