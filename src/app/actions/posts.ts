"use server";

import { revalidatePath } from "next/cache";
import type { AttachmentKind, Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { parseHashtagInput } from "@/lib/hashtags";
import { withTenantRls } from "@/lib/prisma-tenant";
import { buildPostSearchText } from "@/lib/search-text";
import { prisma } from "@/lib/prisma";
import {
  isMimeAllowedForKind,
  isS3Configured,
  maxBytesForKind,
} from "@/lib/storage";
import { deleteObject, presignGetObject, presignPutObject } from "@/lib/s3";

const postFields = z.object({
  tenantSlug: z.string().min(1),
  title: z.string().max(200).optional().nullable(),
  grade: z.string().min(1).max(80),
  subject: z.string().min(1).max(80),
  unit: z.string().min(1).max(500),
  contentItem: z.string().max(500).optional().nullable(),
  aim: z.string().max(5000).optional().nullable(),
  reflection: z.string().max(20000).optional().nullable(),
  point: z.string().min(1).max(20000),
  flow: z.string().min(1).max(20000),
  hashtagsRaw: z.string().max(2000).optional().nullable(),
});

export type PostSearchParams = {
  q?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  tag?: string;
  authorId?: string;
};

export type CurriculumUnitOption = {
  grade: string;
  subject: string;
  name: string;
  category: string | null;
  sortOrder: number;
};

async function ensureCurriculumUnitOption(input: {
  grade: string;
  subject: string;
  unit: string;
}) {
  const grade = input.grade.trim();
  const subject = input.subject.trim();
  const unit = input.unit.trim();
  if (!grade || !subject || !unit) return;

  const delegate = (prisma as unknown as { curriculumUnit?: { upsert: Function } })
    .curriculumUnit;
  if (delegate?.upsert) {
    await prisma.curriculumUnit.upsert({
      where: {
        schoolType_subject_grade_name: {
          schoolType: "junior_high",
          subject,
          grade,
          name: unit,
        },
      },
      create: {
        schoolType: "junior_high",
        subject,
        grade,
        category: "学校追加",
        name: unit,
        aliases: [],
        sortOrder: 9999,
        isActive: true,
      },
      update: {
        isActive: true,
      },
    });
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO "CurriculumUnit"
      ("id", "schoolType", "subject", "grade", "category", "name", "aliases", "sortOrder", "isActive", "createdAt", "updatedAt")
    VALUES
      (md5(random()::text || clock_timestamp()::text), 'junior_high', ${subject}, ${grade}, '学校追加', ${unit}, ARRAY[]::text[], 9999, true, NOW(), NOW())
    ON CONFLICT ("schoolType", "subject", "grade", "name")
    DO UPDATE SET
      "isActive" = true,
      "updatedAt" = NOW()
  `;
}

export async function listPosts(
  tenantId: string,
  params: PostSearchParams,
) {
  const q = params.q?.trim();
  const tag = params.tag?.trim().toLowerCase();

  const filters: Prisma.PostWhereInput[] = [];
  if (params.grade) filters.push({ grade: params.grade });
  if (params.subject) filters.push({ subject: params.subject });
  if (params.unit?.trim())
    filters.push({ unit: { contains: params.unit.trim(), mode: "insensitive" } });
  if (tag) filters.push({ tags: { some: { tag: { name: tag } } } });
  if (params.authorId) filters.push({ authorId: params.authorId });
  if (q) {
    filters.push({
      OR: [
        { searchText: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
        { unit: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  return withTenantRls(tenantId, (tx) =>
    tx.post.findMany({
      where: filters.length ? { AND: filters } : {},
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, image: true } },
        tags: { include: { tag: true } },
        attachments: true,
      },
    }),
  );
}

export async function listPostSearchOptions(tenantId: string): Promise<{
  grades: string[];
  subjects: string[];
  tags: string[];
}> {
  return withTenantRls(tenantId, async (tx) => {
    const [gradeRows, subjectRows, tagRows] = await Promise.all([
      tx.post.findMany({
        distinct: ["grade"],
        select: { grade: true },
        orderBy: { grade: "asc" },
      }),
      tx.post.findMany({
        distinct: ["subject"],
        select: { subject: true },
        orderBy: { subject: "asc" },
      }),
      tx.tag.findMany({
        select: { name: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      grades: gradeRows.map((r) => r.grade),
      subjects: subjectRows.map((r) => r.subject),
      tags: tagRows.map((r) => r.name),
    };
  });
}

export async function listCurriculumUnitOptions(): Promise<CurriculumUnitOption[]> {
  const delegate = (prisma as unknown as { curriculumUnit?: { findMany: Function } })
    .curriculumUnit;

  if (delegate?.findMany) {
    return prisma.curriculumUnit.findMany({
      where: { schoolType: "junior_high", isActive: true },
      select: {
        grade: true,
        subject: true,
        name: true,
        category: true,
        sortOrder: true,
      },
      orderBy: [
        { subject: "asc" },
        { grade: "asc" },
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    });
  }

  console.warn(
    "Prisma client is stale and does not include curriculumUnit delegate. Falling back to raw query.",
  );
  return prisma.$queryRaw<CurriculumUnitOption[]>`
    SELECT
      "grade",
      "subject",
      "name",
      "category",
      "sortOrder"
    FROM "CurriculumUnit"
    WHERE "schoolType" = 'junior_high' AND "isActive" = true
    ORDER BY "subject" ASC, "grade" ASC, "sortOrder" ASC, "name" ASC
  `;
}

export async function getPost(tenantId: string, postId: string) {
  return withTenantRls(tenantId, (tx) =>
    tx.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
        tags: { include: { tag: true } },
        attachments: { orderBy: { createdAt: "asc" } },
      },
    }),
  );
}

async function syncPostTags(
  tx: Prisma.TransactionClient,
  tenantId: string,
  postId: string,
  names: string[],
) {
  await tx.postTag.deleteMany({ where: { postId } });

  for (const name of names) {
    const tag = await tx.tag.upsert({
      where: { tenantId_name: { tenantId, name } },
      create: { tenantId, name },
      update: {},
    });
    await tx.postTag.create({ data: { postId, tagId: tag.id } });
  }
}

function policyOk(formData: FormData): boolean {
  const v = formData.get("policyAccepted");
  return v === "on" || v === "true";
}

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

  const parsed = postFields.safeParse({
    tenantSlug: formData.get("tenantSlug"),
    title: formData.get("title") || null,
    grade: formData.get("grade"),
    subject: formData.get("subject"),
    unit: formData.get("unit"),
    contentItem: formData.get("contentItem") || null,
    aim: formData.get("aim") || null,
    reflection: formData.get("reflection") || null,
    point: formData.get("point"),
    flow: formData.get("flow"),
    hashtagsRaw: formData.get("hashtags") || null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const data = parsed.data;
  if (data.tenantSlug !== session.user.tenantSlug) {
    return { ok: false, message: "テナントが一致しません" };
  }

  const tagNames = parseHashtagInput(data.hashtagsRaw);
  const searchText = buildPostSearchText({
    title: data.title,
    grade: data.grade,
    subject: data.subject,
    unit: data.unit,
    contentItem: data.contentItem,
    aim: data.aim,
    reflection: data.reflection,
    point: data.point,
    flow: data.flow,
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
    } catch (e) {
      // 単元候補登録に失敗しても投稿保存は継続する。
      console.warn("curriculum unit upsert failed", e);
    }

    const post = await withTenantRls(tenantId, async (tx) => {
      const p = await tx.post.create({
        data: {
          tenantId,
          authorId: session.user.id,
          title: data.title || null,
          grade: data.grade,
          subject: data.subject,
          unit: data.unit,
          contentItem: data.contentItem || null,
          aim: data.aim?.trim() ?? "",
          reflection: data.reflection || null,
          point: data.point,
          flow: data.flow,
          searchText,
        },
      });
      await syncPostTags(tx, tenantId, p.id, tagNames);
      return p;
    });

    revalidatePath(`/t/${tenantSlug}/posts`);
    return { ok: true, postId: post.id };
  } catch (e) {
    console.error(e);
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

  const parsed = postFields.safeParse({
    tenantSlug: formData.get("tenantSlug"),
    title: formData.get("title") || null,
    grade: formData.get("grade"),
    subject: formData.get("subject"),
    unit: formData.get("unit"),
    contentItem: formData.get("contentItem") || null,
    aim: formData.get("aim") || null,
    reflection: formData.get("reflection") || null,
    point: formData.get("point"),
    flow: formData.get("flow"),
    hashtagsRaw: formData.get("hashtags") || null,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues.map((i) => i.message).join(" / "),
    };
  }

  const data = parsed.data;
  if (data.tenantSlug !== session.user.tenantSlug) {
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
    aim: data.aim,
    reflection: data.reflection,
    point: data.point,
    flow: data.flow,
    tagNames,
  });

  try {
    try {
      await ensureCurriculumUnitOption({
        grade: data.grade,
        subject: data.subject,
        unit: data.unit,
      });
    } catch (e) {
      console.warn("curriculum unit upsert failed", e);
    }

    await withTenantRls(tenantId, async (tx) => {
      await tx.post.update({
        where: { id: postId },
        data: {
          title: data.title || null,
          grade: data.grade,
          subject: data.subject,
          unit: data.unit,
          contentItem: data.contentItem || null,
          aim: data.aim?.trim() ?? "",
          reflection: data.reflection || null,
          point: data.point,
          flow: data.flow,
          searchText,
        },
      });
      await syncPostTags(tx, tenantId, postId, tagNames);
    });

    revalidatePath(`/t/${tenantSlug}/posts`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}/edit`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "更新に失敗しました" };
  }
}

export async function deletePost(
  tenantSlug: string,
  postId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.tenantSlug !== tenantSlug) {
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
      } catch (e) {
        console.error("S3 delete failed", e);
      }
    }
  }

  try {
    await withTenantRls(tenantId, (tx) =>
      tx.post.delete({ where: { id: postId } }),
    );
    revalidatePath(`/t/${tenantSlug}/posts`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "削除に失敗しました" };
  }
}

export async function presignUploadForPost(input: {
  tenantSlug: string;
  postId: string;
  kind: AttachmentKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
}): Promise<
  { ok: true; uploadUrl: string; storageKey: string } | { ok: false; message: string }
> {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.tenantSlug !== input.tenantSlug) {
    return { ok: false, message: "未ログインです" };
  }
  if (!isS3Configured()) {
    return { ok: false, message: "ファイルストレージが未設定です" };
  }

  if (!isMimeAllowedForKind(input.kind, input.mimeType)) {
    return { ok: false, message: "このファイル形式は許可されていません" };
  }

  const maxB = maxBytesForKind(input.kind);
  if (input.sizeBytes <= 0 || input.sizeBytes > maxB) {
    return { ok: false, message: `ファイルサイズが上限（${maxB} バイト）を超えています` };
  }

  const tenantId = session.user.tenantId;
  const post = await getPost(tenantId, input.postId);
  if (!post || post.authorId !== session.user.id) {
    return { ok: false, message: "アップロードする権限がありません" };
  }

  try {
    const { uploadUrl, storageKey } = await presignPutObject({
      tenantId,
      postId: input.postId,
      originalFilename: input.originalFilename,
      mimeType: input.mimeType,
    });
    return { ok: true, uploadUrl, storageKey };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "署名付き URL の発行に失敗しました" };
  }
}

export async function registerAttachment(input: {
  tenantSlug: string;
  postId: string;
  kind: AttachmentKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  storageKey: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.tenantSlug !== input.tenantSlug) {
    return { ok: false, message: "未ログインです" };
  }

  if (!isMimeAllowedForKind(input.kind, input.mimeType)) {
    return { ok: false, message: "このファイル形式は許可されていません" };
  }

  const maxB = maxBytesForKind(input.kind);
  if (input.sizeBytes <= 0 || input.sizeBytes > maxB) {
    return { ok: false, message: "ファイルサイズが不正です" };
  }

  const tenantId = session.user.tenantId;
  const post = await getPost(tenantId, input.postId);
  if (!post || post.authorId !== session.user.id) {
    return { ok: false, message: "登録する権限がありません" };
  }

  if (!input.storageKey.startsWith(`${tenantId}/${input.postId}/`)) {
    return { ok: false, message: "ストレージキーが不正です" };
  }

  try {
    await withTenantRls(tenantId, (tx) =>
      tx.attachment.create({
        data: {
          postId: input.postId,
          kind: input.kind,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          originalFilename: input.originalFilename,
          storageKey: input.storageKey,
        },
      }),
    );
    revalidatePath(`/t/${input.tenantSlug}/posts/${input.postId}`);
    revalidatePath(`/t/${input.tenantSlug}/posts/${input.postId}/edit`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "添付の登録に失敗しました" };
  }
}

export async function getAttachmentDownloadUrl(
  tenantSlug: string,
  attachmentId: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.tenantSlug !== tenantSlug) {
    return { ok: false, message: "未ログインです" };
  }
  if (!isS3Configured()) {
    return { ok: false, message: "ファイルストレージが未設定です" };
  }

  const tenantId = session.user.tenantId;
  const row = await withTenantRls(tenantId, (tx) =>
    tx.attachment.findUnique({
      where: { id: attachmentId },
      include: { post: true },
    }),
  );

  if (!row || row.post.tenantId !== tenantId) {
    return { ok: false, message: "見つかりません" };
  }

  try {
    const url = await presignGetObject(row.storageKey);
    return { ok: true, url };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "ダウンロード URL の発行に失敗しました" };
  }
}
