"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { parseHashtagInput } from "@/lib/hashtags";
import { withTenantRls } from "@/lib/prisma-tenant";
import { buildPostSearchText } from "@/lib/search-text";
import { deleteObject } from "@/lib/s3";
import { buildAttachmentThumbStorageKey } from "@/lib/attachment-thumbnail";
import { isS3Configured } from "@/lib/storage";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { getPost } from "@/lib/queries/posts";
import {
  ensureCurriculumUnitOption,
  parsePostFormInput,
  policyOk,
  postFields,
  syncPostTags,
  transferReflectionDbData,
} from "@/lib/post-action-helpers";

export async function createPost(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true; postId: string } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { ok: false, message: "未ログインです" };
  }
  if (session.user.role === "readonly") {
    return { ok: false, message: "閲覧専用アカウントは投稿できません" };
  }

  if (!policyOk(formData)) {
    return { ok: false, message: "投稿ポリシーへの同意が必要です" };
  }

  const parsed = postFields.safeParse(parsePostFormInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const data = { ...parsed.data, unit: parsed.data.unit.trim() };
  if (!canAccessTenantRoute(session, data.tenantSlug)) {
    return { ok: false, message: "テナントが一致しません" };
  }

  const tagNames = parseHashtagInput(data.hashtagsRaw);
  const searchText = buildPostSearchText({
    title: data.title,
    grade: data.grade,
    subject: data.subject,
    unit: data.unit,
    contentItem: data.contentItem,
    aim: data.aim?.trim() ?? "",
    reflection: data.reflection?.trim() || null,
    point: data.point?.trim() || null,
    flow: data.flow?.trim() || null,
    tagNames,
  });

  const tenantId = session.user.tenantId;
  const tenantSlug = data.tenantSlug;

  try {
    try {
      await ensureCurriculumUnitOption({
        grade: data.grade,
        subject: data.subject,
        unit: data.unit,
      });
    } catch {}

    const isDraft = data.isDraft;

    const post = await withTenantRls(tenantId, async (tx) => {
      const p = await tx.post.create({
        data: {
          tenantId,
          authorId: session.user.id,
          category: data.category,
          title: data.title || null,
          grade: data.grade,
          subject: data.subject,
          unit: data.unit,
          contentItem: data.contentItem || null,
          aim: data.aim?.trim() ?? "",
          reflection: data.reflection?.trim() || null,
          point: data.point?.trim() || null,
          flow: data.flow?.trim() || null,
          referenceUrl: data.referenceUrl?.trim() || null,
          searchText,
          isPublished: !isDraft,
          ...transferReflectionDbData(data),
        } satisfies Prisma.PostUncheckedCreateInput,
      });
      await syncPostTags(tx, tenantId, p.id, tagNames);
      return p;
    });

    revalidatePath(`/t/${tenantSlug}/posts`);
    if (!isDraft) {
      revalidatePath(`/t/${tenantSlug}/summary`);
    }
    return { ok: true, postId: post.id };
  } catch {
    return { ok: false, message: "保存に失敗しました" };
  }
}

export async function updatePost(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { ok: false, message: "未ログインです" };
  }

  if (!policyOk(formData)) {
    return { ok: false, message: "投稿ポリシーへの同意が必要です" };
  }

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return { ok: false, message: "投稿 ID が不正です" };

  const parsed = postFields.safeParse(parsePostFormInput(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const data = { ...parsed.data, unit: parsed.data.unit.trim() };
  if (!canAccessTenantRoute(session, data.tenantSlug)) {
    return { ok: false, message: "テナントが一致しません" };
  }

  const tenantId = session.user.tenantId;
  const tenantSlug = data.tenantSlug;

  const existing = await getPost(tenantId, postId);
  if (!existing || (existing.authorId !== session.user.id && session.user.role !== "admin")) {
    return { ok: false, message: "編集する権限がありません（作成者またはadminのみ）" };
  }

  const tagNames = parseHashtagInput(data.hashtagsRaw);
  const searchText = buildPostSearchText({
    title: data.title,
    grade: data.grade,
    subject: data.subject,
    unit: data.unit,
    contentItem: data.contentItem,
    aim: data.aim?.trim() ?? "",
    reflection: data.reflection?.trim() || null,
    point: data.point?.trim() || null,
    flow: data.flow?.trim() || null,
    tagNames,
  });

  try {
    try {
      await ensureCurriculumUnitOption({
        grade: data.grade,
        subject: data.subject,
        unit: data.unit,
      });
    } catch {}

    const isDraft = data.isDraft;
    const isFirstPublish = !isDraft && existing.isPublished === false;

    await withTenantRls(tenantId, async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: {
          title: data.title || null,
          category: data.category,
          grade: data.grade,
          subject: data.subject,
          unit: data.unit,
          contentItem: data.contentItem || null,
          aim: data.aim?.trim() ?? "",
          reflection: data.reflection?.trim() || null,
          point: data.point?.trim() || null,
          flow: data.flow?.trim() || null,
          referenceUrl: data.referenceUrl?.trim() || null,
          searchText,
          isPublished: !isDraft,
          ...(isFirstPublish ? { createdAt: new Date() } : {}),
          ...transferReflectionDbData(data),
        } satisfies Prisma.PostUncheckedUpdateInput,
      });
      await syncPostTags(tx, tenantId, postId, tagNames);
    });

    revalidatePath(`/t/${tenantSlug}/posts`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}/edit`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}/complete`);
    revalidatePath(`/t/${tenantSlug}/posts/new`);
    revalidatePath(`/t/${tenantSlug}/mypage`);
    if (!isDraft) {
      revalidatePath(`/t/${tenantSlug}/summary`);
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "更新に失敗しました" };
  }
}

export async function deletePost(
  tenantSlug: string,
  postId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !canAccessTenantRoute(session, tenantSlug)) {
    return { ok: false, message: "未ログインです" };
  }

  const tenantId = session.user.tenantId;
  const existing = await getPost(tenantId, postId);
  if (!existing || (existing.authorId !== session.user.id && session.user.role !== "admin")) {
    return { ok: false, message: "削除する権限がありません（作成者またはadminのみ）" };
  }

  if (isS3Configured()) {
    for (const a of existing.attachments) {
      try {
        await deleteObject(a.storageKey);
        await deleteObject(
          buildAttachmentThumbStorageKey(tenantId, postId, a.id),
        );
      } catch {}
    }
  }

  try {
    await withTenantRls(tenantId, (tx) =>
      tx.post.delete({ where: { id: postId } }),
    );
    revalidatePath(`/t/${tenantSlug}/posts`);
    revalidatePath(`/t/${tenantSlug}/mypage`);
    revalidatePath(`/t/${tenantSlug}/summary`);
    return { ok: true };
  } catch {
    return { ok: false, message: "削除に失敗しました" };
  }
}
