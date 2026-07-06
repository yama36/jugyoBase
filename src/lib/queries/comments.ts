import "server-only";

import { prisma } from "@/lib/prisma";

export async function listComments(tenantId: string, postId: string) {
  return prisma.comment.findMany({
    where: { postId, post: { tenantId } },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
