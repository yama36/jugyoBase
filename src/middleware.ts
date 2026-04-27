import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const path = req.nextUrl.pathname;
  if (!path.startsWith("/t/")) return NextResponse.next();

  const parts = path.split("/").filter(Boolean);
  const slug = parts[1];
  if (!slug) return NextResponse.next();

  if (path === `/t/${slug}/login` || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!req.auth?.user?.tenantSlug) {
    return NextResponse.redirect(new URL(`/t/${slug}/login`, req.url));
  }

  if (req.auth.user.tenantSlug !== slug) {
    return NextResponse.redirect(
      new URL(`/t/${req.auth.user.tenantSlug}/posts`, req.url),
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/t/:tenantSlug/:path*"],
};
