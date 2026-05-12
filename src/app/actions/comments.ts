"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function listComments(tenantId: string, postId: string) {
  return prisma.comment.findMany({
    where: { postId, post: { tenantId } },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createComment(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return { ok: false, error: "認証が必要です" };
  }
  if (session.user.role === "readonly") {
    return { ok: false, error: "閲覧専用アカウントはコメントできません" };
  }

  const postId = String(formData.get("postId") ?? "");
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!body) return { ok: false, error: "コメントを入力してください" };
  if (body.length > 1000) return { ok: false, error: "コメントは1000文字以内で入力してください" };

  const post = await prisma.post.findFirst({
    where: { id: postId, tenantId: session.user.tenantId },
  });
  if (!post) return { ok: false, error: "投稿が見つかりません" };

  await prisma.comment.create({
    data: { postId, authorId: session.user.id, body },
  });

  if (post.authorId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "comment",
        postId,
        actorId: session.user.id,
      },
    });
  }

  revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
  return { ok: true };
}

export async function deleteComment(
  tenantSlug: string,
  commentId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) {
    return { ok: false, message: "認証が必要です" };
  }

  const comment = await prisma.comment.findFirst({
    where: { id: commentId, post: { tenantId: session.user.tenantId } },
  });
  if (!comment) return { ok: false, message: "コメントが見つかりません" };

  if (comment.authorId !== session.user.id && session.user.role !== "admin") {
    return { ok: false, message: "削除権限がありません" };
  }

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/t/${tenantSlug}/posts/${comment.postId}`);
  return { ok: true };
}
