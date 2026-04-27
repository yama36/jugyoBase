import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      tenantId: string;
      tenantSlug: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tenantId?: string;
    tenantSlug?: string;
  }
}
