"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleTried(
  tenantSlug: string,
  postId: string,
): Promise<{ ok: true; tried: boolean } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return { ok: false, error: "認証が必要です" };
  }
  if (session.user.role === "readonly") {
    return { ok: false, error: "閲覧専用アカウントは試したを押せません" };
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, tenantId: session.user.tenantId },
  });
  if (!post) return { ok: false, error: "投稿が見つかりません" };

  const existing = await prisma.postTried.findUnique({
    where: { postId_userId: { postId, userId: session.user.id } },
  });

  if (existing) {
    await prisma.postTried.delete({
      where: { postId_userId: { postId, userId: session.user.id } },
    });
    revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
    revalidatePath(`/t/${tenantSlug}/posts`);
    return { ok: true, tried: false };
  }

  await prisma.postTried.create({
    data: { postId, userId: session.user.id },
  });

  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "tried",
        postId,
        actorId: session.user.id,
      },
    });
  }

  revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
  revalidatePath(`/t/${tenantSlug}/posts`);
  return { ok: true, tried: true };
}
