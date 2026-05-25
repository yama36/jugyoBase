import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { APP_BASE_PATH } from "@/lib/app-base-path";
import { COOKIE_TENANT_SLUG } from "@/lib/auth-constants";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

function resolveGoogleClientId(): string {
  return process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
}

function resolveGoogleClientSecret(): string {
  return process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  basePath: `${APP_BASE_PATH}/api/auth`,
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Google({
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
      clientId: resolveGoogleClientId(),
      clientSecret: resolveGoogleClientSecret(),
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ? normalizeEmail(profile.email) : null;
      if (!email) return false;

      const cookieStore = await cookies();
      const slug = cookieStore.get(COOKIE_TENANT_SLUG)?.value;
      if (!slug) return false;

      const tenant = await prisma.tenant.findUnique({ where: { slug } });
      if (!tenant) return false;

      if (tenant.googleHostedDomain) {
        const allowedDomain = tenant.googleHostedDomain.trim().toLowerCase();
        const loginDomain = domainFromEmail(email);
        const profileHd =
          typeof (profile as { hd?: unknown } | null)?.hd === "string"
            ? ((profile as { hd?: string }).hd ?? "").toLowerCase()
            : null;

        if (!loginDomain || loginDomain !== allowedDomain) {
          return false;
        }
        if (profileHd && profileHd !== allowedDomain) {
          return false;
        }

        // ドメイン一致: 初回ログイン時に自動でユーザー登録
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (!existingUser) {
          await prisma.user.create({
            data: {
              email,
              name: (profile as { name?: string }).name ?? email.split("@")[0],
              image: (profile as { picture?: string }).picture ?? null,
              emailVerified: new Date(),
              tenantId: tenant.id,
              tenantSlug: tenant.slug,
            },
          });
          return true;
        }

        if (existingUser.tenantId !== tenant.id || existingUser.tenantSlug !== slug) {
          return false;
        }
        return true;
      }

      // ドメイン制限なし: 事前登録必須
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user || user.tenantId !== tenant.id || user.tenantSlug !== slug) {
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as { tenantId?: string; tenantSlug?: string };
        if (u.tenantId) token.tenantId = u.tenantId;
        if (u.tenantSlug) token.tenantSlug = u.tenantSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.tenantId) session.user.tenantId = token.tenantId as string;
      if (token.tenantSlug) session.user.tenantSlug = token.tenantSlug as string;
      return session;
    },
  },
  events: {
    async signIn() {
      const cookieStore = await cookies();
      cookieStore.delete(COOKIE_TENANT_SLUG);
    },
  },
});
