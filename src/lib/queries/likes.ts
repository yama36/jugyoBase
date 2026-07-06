import "server-only";

import { prisma } from "@/lib/prisma";

export async function getPostLikeInfo(
  postId: string,
  userId: string | null,
): Promise<{ count: number; liked: boolean }> {
  const [count, userLike] = await Promise.all([
    prisma.postLike.count({ where: { postId } }),
    userId
      ? prisma.postLike.findUnique({
          where: { postId_userId: { postId, userId } },
        })
      : Promise.resolve(null),
  ]);
  return { count, liked: !!userLike };
}
