import "server-only";

import { prisma } from "@/lib/prisma";

export async function getPostTriedInfo(
  postId: string,
  userId: string | null,
): Promise<{ count: number; tried: boolean }> {
  const [count, userTried] = await Promise.all([
    prisma.postTried.count({ where: { postId } }),
    userId
      ? prisma.postTried.findUnique({
          where: { postId_userId: { postId, userId } },
        })
      : Promise.resolve(null),
  ]);
  return { count, tried: !!userTried };
}
