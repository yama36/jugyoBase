"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleBookmark(
  tenantSlug: string,
  postId: string,
): Promise<{ ok: true; bookmarked: boolean } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return { ok: false, error: "認証が必要です" };
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, tenantId: session.user.tenantId },
  });
  if (!post) return { ok: false, error: "投稿が見つかりません" };

  const existing = await prisma.bookmark.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { postId_userId: { postId, userId: session.user.id } },
    });
    revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
    return { ok: true, bookmarked: false };
  }

  await prisma.bookmark.create({
    data: { postId, userId: session.user.id },
  });
  revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
  return { ok: true, bookmarked: true };
}

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
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return bookmarks.map((b) => b.post);
}
