import "server-only";

import { prisma } from "@/lib/prisma";

export async function getBookmarkStatus(
  postId: string,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;
  const b = await prisma.bookmark.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  return !!b;
}

export async function listBookmarkedPosts(tenantId: string, userId: string) {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, post: { tenantId } },
    include: {
      post: {
        include: {
          author: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
          attachments: {
            select: {
              id: true,
              kind: true,
              originalFilename: true,
              malwareScanStatus: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return bookmarks.map((b) => b.post);
}
