"use server";

import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { COOKIE_TENANT_SLUG } from "@/lib/auth-constants";

export async function startGoogleSignIn(tenantSlug: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_TENANT_SLUG, tenantSlug, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { googleHostedDomain: true },
  });

  const authzParams: Record<string, string> = {
    // OIDC の必須スコープ。これが欠けると id_token の issuer 検証で失敗する。
    scope: "openid email profile",
  };
  if (tenant?.googleHostedDomain && tenant.googleHostedDomain.trim()) {
    authzParams.hd = tenant.googleHostedDomain.trim().toLowerCase();
  }

  await signIn("google", { redirectTo: `/t/${tenantSlug}/posts` }, authzParams);
}

export async function loginWithTenantForm(formData: FormData) {
  const slug = String(formData.get("tenantSlug") ?? "").trim();
  if (!slug) return;
  await startGoogleSignIn(slug);
}

export async function signOutFromApp() {
  await signOut({ redirectTo: "/" });
}
