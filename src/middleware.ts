import { auth } from "@/auth";
import { APP_BASE_PATH } from "@/lib/app-base-path";
import { NextResponse } from "next/server";
import { DEMO_TENANT_SLUG } from "@/lib/demo-public";

function stripBasePath(pathname: string): string {
  if (pathname === APP_BASE_PATH || pathname.startsWith(`${APP_BASE_PATH}/`)) {
    const rest = pathname.slice(APP_BASE_PATH.length);
    return rest === "" ? "/" : rest;
  }
  return pathname;
}

export default auth((req) => {
  const path = stripBasePath(req.nextUrl.pathname);
  if (!path.startsWith("/t/")) return NextResponse.next();

  const parts = path.split("/").filter(Boolean);
  const slug = parts[1];
  if (!slug) return NextResponse.next();

  if (path === `/t/${slug}/login`) {
    return NextResponse.next();
  }

  if (slug === DEMO_TENANT_SLUG) {
    return NextResponse.next();
  }

  if (!req.auth?.user?.tenantSlug) {
    return NextResponse.redirect(
      new URL(`${APP_BASE_PATH}/t/${slug}/login`, req.url),
    );
  }

  if (req.auth.user.tenantSlug !== slug) {
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
    return NextResponse.redirect(new URL(`${APP_BASE_PATH}${targetPath}`, req.url));
  }

  return NextResponse.next();
});

/** `APP_BASE_PATH` と同一パスプレフィックス（Next の matcher は静的文字列必須のためここにベタ書き）。 */
export const config = {
  matcher: ["/jugyobase/t/:tenantSlug/:path*"],
};
