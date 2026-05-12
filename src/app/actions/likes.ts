"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleLike(
  tenantSlug: string,
  postId: string,
): Promise<{ ok: true; liked: boolean } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return { ok: false, error: "認証が必要です" };
  }
  if (session.user.role === "readonly") {
    return { ok: false, error: "閲覧専用アカウントはいいねできません" };
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, tenantId: session.user.tenantId },
  });
  if (!post) return { ok: false, error: "投稿が見つかりません" };

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.postLike.delete({
      where: { postId_userId: { postId, userId: session.user.id } },
    });
    revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
    return { ok: true, liked: false };
  }

  await prisma.postLike.create({
    data: { postId, userId: session.user.id },
  });

  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "like",
        postId,
        actorId: session.user.id,
      },
    });
  }

  revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
  return { ok: true, liked: true };
}

export async function getPostLikeInfo(
  tenantId: string,
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
