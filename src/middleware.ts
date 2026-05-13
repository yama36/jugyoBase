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
  const pathname = req.nextUrl.pathname;
  if (pathname.startsWith("/api/auth") && !pathname.startsWith(`${APP_BASE_PATH}/`)) {
    const url = req.nextUrl.clone();
    url.pathname = `${APP_BASE_PATH}${pathname}`;
    return NextResponse.redirect(url);
  }

  const path = stripBasePath(pathname);
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

export const config = {
  matcher: ["/jugyobase/t/:tenantSlug/:path*", "/api/auth/:path*"],
};
