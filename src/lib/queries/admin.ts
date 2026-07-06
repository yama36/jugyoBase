import "server-only";

import { prisma } from "@/lib/prisma";

export async function listTenantUsers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      schoolType: true,
      prefecture: true,
      googleHostedDomain: true,
    },
  });
}
