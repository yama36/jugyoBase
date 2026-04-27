import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

/**
 * Post / Tag / PostTag / Attachment は RLS 対象。
 * 各トランザクション先頭で `jugyoBase.tenant_id` をセットする。
 */
export async function withTenantRls<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('jugyoBase.tenant_id', ${tenantId}, true)`;
      return fn(tx);
    },
    { maxWait: 5000, timeout: 30000 },
  );
}
