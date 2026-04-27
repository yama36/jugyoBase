import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { COOKIE_TENANT_SLUG } from "@/lib/auth-constants";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at === -1 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

function isLocalAuthEnvironment(): boolean {
  const authUrl = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").toLowerCase();
  return (
    process.env.NODE_ENV !== "production" ||
    authUrl.includes("localhost") ||
    authUrl.includes("127.0.0.1")
  );
}

function resolveGoogleClientId(): string {
  if (isLocalAuthEnvironment()) {
    return (
      process.env.AUTH_GOOGLE_ID_DEV ??
      process.env.GOOGLE_CLIENT_ID_DEV ??
      process.env.AUTH_GOOGLE_ID ??
      process.env.GOOGLE_CLIENT_ID ??
      ""
    );
  }

  return process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID ?? "";
}

function resolveGoogleClientSecret(): string {
  if (isLocalAuthEnvironment()) {
    return (
      process.env.AUTH_GOOGLE_SECRET_DEV ??
      process.env.GOOGLE_CLIENT_SECRET_DEV ??
      process.env.AUTH_GOOGLE_SECRET ??
      process.env.GOOGLE_CLIENT_SECRET ??
      ""
    );
  }

  return process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET ?? "";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 開発時の UntrustedHost を避けるため有効化。
  // OAuth の redirect URI は Google Console 側を localhost に揃えて運用する。
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Google({
      // このアプリは運用で User を事前作成してから Google ログインさせる。
      // 同一メールの OAuth 初回ログイン時に Account を紐付けるため有効化する。
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

        // hd ヒントは UI 側誘導。最終的な許可判定はメールドメインで行う。
        if (!loginDomain || loginDomain !== allowedDomain) {
          return false;
        }
        if (profileHd && profileHd !== allowedDomain) {
          return false;
        }
      }

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
