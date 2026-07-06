"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { parseHashtagInput } from "@/lib/hashtags";
import { withTenantRls } from "@/lib/prisma-tenant";
import { buildPostSearchText } from "@/lib/search-text";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { getPost } from "@/lib/queries/posts";
import { newPostShellDraftWhere } from "@/lib/post-shell-draft";
import {
  autosaveDraftFields,
  normalizeAutosaveReferenceUrl,
  parsePostFormInput,
  syncPostTags,
  transferReflectionDbData,
} from "@/lib/post-action-helpers";

/**
 * 新規投稿画面用に postId を用意する。
 * 同一ユーザー・同一テナントで「まだ中身が入っていない下書き」があれば直近 1 件を再利用し、なければ新規作成する。
 */
export async function createShellDraftPost(
  tenantSlug: string,
): Promise<{ ok: true; postId: string } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { ok: false, message: "未ログインです" };
  }
  if (session.user.role === "readonly") {
    return { ok: false, message: "閲覧専用アカウントは投稿できません" };
  }
  if (!canAccessTenantRoute(session, tenantSlug)) {
    return { ok: false, message: "テナントが一致しません" };
  }

  const tenantId = session.user.tenantId;

  const searchText = buildPostSearchText({
    title: null,
    grade: "",
    subject: "",
    unit: "",
    contentItem: null,
    aim: "",
    reflection: null,
    point: null,
    flow: null,
    tagNames: [],
  });

  try {
    const reused = await withTenantRls(tenantId, (tx) =>
      tx.post.findFirst({
        where: newPostShellDraftWhere(session.user.id),
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      }),
    );
    if (reused) {
      return { ok: true, postId: reused.id };
    }

    const latestDraft = await withTenantRls(tenantId, (tx) =>
      tx.post.findFirst({
        where: {
          authorId: session.user.id,
          isPublished: false,
        },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      }),
    );
    if (latestDraft) {
      return { ok: true, postId: latestDraft.id };
    }

    const post = await withTenantRls(tenantId, async (tx) =>
      tx.post.create({
        data: {
          tenantId,
          authorId: session.user.id,
          title: null,
          grade: "",
          subject: "",
          unit: "",
          contentItem: null,
          aim: "",
          reflection: null,
          point: null,
          flow: null,
          searchText,
          isPublished: false,
        } satisfies Prisma.PostUncheckedCreateInput,
      }),
    );
    return { ok: true, postId: post.id };
  } catch {
    return { ok: false, message: "下書きの準備に失敗しました" };
  }
}

export async function autosaveDraftPost(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { ok: false, message: "未ログインです" };
  }
  if (session.user.role === "readonly") {
    return { ok: false, message: "閲覧専用アカウントは投稿できません" };
  }

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return { ok: false, message: "投稿 ID が不正です" };

  const parsed = autosaveDraftFields.safeParse({
    ...parsePostFormInput(formData, { isDraft: true }),
    postId,
    category: formData.get("category") || "授業",
  });

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
  if (!existing || existing.authorId !== session.user.id) {
    return { ok: false, message: "保存する権限がありません" };
  }

  const tagNames = parseHashtagInput(data.hashtagsRaw);
  const referenceUrl = normalizeAutosaveReferenceUrl(data.referenceUrl);
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
          referenceUrl,
          searchText,
          ...transferReflectionDbData(data),
        } satisfies Prisma.PostUncheckedUpdateInput,
      });
      await syncPostTags(tx, tenantId, postId, tagNames);
    });

    revalidatePath(`/t/${tenantSlug}/posts/new`);
    return { ok: true };
  } catch {
    return { ok: false, message: "自動保存に失敗しました" };
  }
}
