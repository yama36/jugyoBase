"use server";

import { revalidatePath } from "next/cache";
import type { AttachmentKind, Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { parseHashtagInput } from "@/lib/hashtags";
import { withTenantRls } from "@/lib/prisma-tenant";
import { buildPostSearchText } from "@/lib/search-text";
import { prisma } from "@/lib/prisma";
import { initialMalwareScanStatus } from "@/lib/malware-scan";
import {
  isMimeAllowedForKind,
  isS3Configured,
  maxBytesForKind,
  resolveAttachmentContentType,
} from "@/lib/storage";
import {
  deleteObject,
  getObjectForStream,
  presignGetObject,
  presignPutObject,
} from "@/lib/s3";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { isDemoTenantSlug } from "@/lib/demo-public";
import { newPostShellDraftWhere } from "@/lib/post-shell-draft";

const postFields = z.object({
  tenantSlug: z.string().min(1),
  title: z.string().max(200).optional().nullable(),
  grade: z.string().min(1).max(80),
  subject: z.string().min(1).max(80),
  unit: z.string().min(1).max(500),
  contentItem: z.string().max(500).optional().nullable(),
  aim: z.string().max(5000).optional().nullable(),
  reflection: z.string().max(20000).optional().nullable(),
  point: z.string().max(20000).optional().nullable(),
  flow: z.string().max(20000).optional().nullable(),
  hashtagsRaw: z.string().max(2000).optional().nullable(),
});

export type PostSearchParams = {
  q?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  tag?: string;
  authorId?: string;
  includeDrafts?: boolean;
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
  if (!params.includeDrafts) filters.push({ isPublished: true });
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
        attachments: {
          select: {
            id: true,
            kind: true,
            originalFilename: true,
            malwareScanStatus: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
      } as any,
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
        } as any,
      }),
    );
    return { ok: true, postId: post.id };
  } catch {
    return { ok: false, message: "下書きの準備に失敗しました" };
  }
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

    const isDraft = formData.get("isDraft") === "on";

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
          reflection: data.reflection?.trim() || null,
          point: data.point?.trim() || null,
          flow: data.flow?.trim() || null,
          searchText,
          isPublished: !isDraft,
        } as any,
      });
      await syncPostTags(tx, tenantId, p.id, tagNames);
      return p;
    });

    revalidatePath(`/t/${tenantSlug}/posts`);
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

    const isDraft = formData.get("isDraft") === "on";

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
          reflection: data.reflection?.trim() || null,
          point: data.point?.trim() || null,
          flow: data.flow?.trim() || null,
          searchText,
          isPublished: !isDraft,
        } as any,
      });
      await syncPostTags(tx, tenantId, postId, tagNames);
    });

    revalidatePath(`/t/${tenantSlug}/posts`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}/edit`);
    revalidatePath(`/t/${tenantSlug}/posts/${postId}/complete`);
    revalidatePath(`/t/${tenantSlug}/posts/new`);
    revalidatePath(`/t/${tenantSlug}/mypage`);
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
      } catch {}
    }
  }

  try {
    await withTenantRls(tenantId, (tx) =>
      tx.post.delete({ where: { id: postId } }),
    );
    revalidatePath(`/t/${tenantSlug}/posts`);
    return { ok: true };
  } catch {
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
  if (!session?.user?.tenantId || !canAccessTenantRoute(session, input.tenantSlug)) {
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
  } catch {
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
  if (!session?.user?.tenantId || !canAccessTenantRoute(session, input.tenantSlug)) {
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
          malwareScanStatus: initialMalwareScanStatus(),
        },
      }),
    );
    revalidatePath(`/t/${input.tenantSlug}/posts/${input.postId}`);
    revalidatePath(`/t/${input.tenantSlug}/posts/${input.postId}/edit`);
    revalidatePath(`/t/${input.tenantSlug}/posts/new`);
    return { ok: true };
  } catch {
    return { ok: false, message: "添付の登録に失敗しました" };
  }
}

export type AttachmentDownloadUrlResult =
  | { ok: true; url: string }
  | { ok: false; message: string; httpStatus?: number };

type AttachmentWithPost = {
  id: string;
  postId: string;
  kind: AttachmentKind;
  mimeType: string;
  originalFilename: string;
  sizeBytes: number;
  storageKey: string;
  malwareScanStatus: string;
  post: { tenantId: string; title: string | null };
};

type ResolveAttachmentAccessResult =
  | { ok: true; row: AttachmentWithPost; tenantId: string }
  | { ok: false; message: string; httpStatus?: number };

async function resolveAttachmentAccess(
  tenantSlug: string,
  attachmentId: string,
): Promise<ResolveAttachmentAccessResult> {
  const session = await auth();

  let tenantId: string | null = null;
  if (isDemoTenantSlug(tenantSlug)) {
    const t = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });
    tenantId = t?.id ?? null;
  } else {
    if (!session?.user?.tenantId || !canAccessTenantRoute(session, tenantSlug)) {
      return { ok: false, message: "未ログインです", httpStatus: 401 };
    }
    tenantId = session.user.tenantId;
  }

  if (!tenantId) {
    return { ok: false, message: "見つかりません", httpStatus: 404 };
  }
  if (!isS3Configured()) {
    return { ok: false, message: "ファイルストレージが未設定です", httpStatus: 503 };
  }

  const row = await withTenantRls(tenantId, (tx) =>
    tx.attachment.findUnique({
      where: { id: attachmentId },
      include: { post: { select: { tenantId: true, title: true } } },
    }),
  );

  if (!row || row.post.tenantId !== tenantId) {
    return { ok: false, message: "見つかりません", httpStatus: 404 };
  }

  if (row.malwareScanStatus === "pending") {
    return {
      ok: false,
      message:
        "マルウェア検査が完了していません。しばらくしてから再度お試しください。",
      httpStatus: 403,
    };
  }
  if (row.malwareScanStatus === "error") {
    return {
      ok: false,
      message:
        "添付ファイルの検査でエラーが発生したため、ダウンロードできません。",
      httpStatus: 403,
    };
  }
  if (row.malwareScanStatus === "infected") {
    return {
      ok: false,
      message: "この添付は利用できません。",
      httpStatus: 403,
    };
  }

  return { ok: true, row, tenantId };
}

export type AttachmentSiblingRef = {
  id: string;
  originalFilename: string;
  kind: AttachmentKind;
};

export type AttachmentViewDataResult =
  | {
      ok: true;
      attachment: {
        id: string;
        kind: AttachmentKind;
        originalFilename: string;
        mimeType: string;
        sizeBytes: number;
        viewUrl: string | null;
      };
      postTitle: string;
      /** 同一投稿内で表示可能な添付（検査済み・昇順） */
      siblings: {
        items: AttachmentSiblingRef[];
        currentIndex: number;
      };
    }
  | { ok: false; message: string; httpStatus?: number };

export async function getAttachmentViewData(
  tenantSlug: string,
  postId: string,
  attachmentId: string,
): Promise<AttachmentViewDataResult> {
  const access = await resolveAttachmentAccess(tenantSlug, attachmentId);
  if (!access.ok) {
    return {
      ok: false,
      message: access.message,
      httpStatus: access.httpStatus,
    };
  }

  const { row, tenantId } = access;
  if (row.postId !== postId) {
    return { ok: false, message: "見つかりません", httpStatus: 404 };
  }

  let viewUrl: string | null = null;
  if (row.kind === "pdf") {
    viewUrl = `/t/${tenantSlug}/files/${attachmentId}/stream`;
  } else if (row.kind === "image" || row.kind === "video") {
    try {
      viewUrl = await presignGetObject(row.storageKey);
    } catch {
      return {
        ok: false,
        message: "表示用 URL の発行に失敗しました",
        httpStatus: 500,
      };
    }
  }

  const siblingRows = await withTenantRls(tenantId, (tx) =>
    tx.attachment.findMany({
      where: { postId, malwareScanStatus: "clean" },
      orderBy: { createdAt: "asc" },
      select: { id: true, originalFilename: true, kind: true },
    }),
  );
  const currentIndex = siblingRows.findIndex((a) => a.id === attachmentId);
  if (currentIndex < 0) {
    return { ok: false, message: "見つかりません", httpStatus: 404 };
  }

  return {
    ok: true,
    attachment: {
      id: row.id,
      kind: row.kind,
      originalFilename: row.originalFilename,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      viewUrl,
    },
    postTitle: row.post.title?.trim() || "（無題）",
    siblings: {
      items: siblingRows,
      currentIndex,
    },
  };
}

export async function getAttachmentDownloadUrl(
  tenantSlug: string,
  attachmentId: string,
): Promise<AttachmentDownloadUrlResult> {
  const access = await resolveAttachmentAccess(tenantSlug, attachmentId);
  if (!access.ok) {
    return {
      ok: false,
      message: access.message,
      httpStatus: access.httpStatus,
    };
  }

  try {
    const url = await presignGetObject(access.row.storageKey);
    return { ok: true, url };
  } catch {
    return { ok: false, message: "ダウンロード URL の発行に失敗しました" };
  }
}

export async function streamAttachmentObject(
  tenantSlug: string,
  attachmentId: string,
): Promise<
  | {
      ok: true;
      body: import("stream").Readable;
      contentType: string;
      contentLength: number | undefined;
      filename: string;
    }
  | { ok: false; message: string; httpStatus?: number }
> {
  const access = await resolveAttachmentAccess(tenantSlug, attachmentId);
  if (!access.ok) {
    return {
      ok: false,
      message: access.message,
      httpStatus: access.httpStatus,
    };
  }

  try {
    const streamed = await getObjectForStream(access.row.storageKey);
    return {
      ok: true,
      body: streamed.body,
      contentLength: streamed.contentLength,
      contentType: resolveAttachmentContentType(
        streamed.contentType,
        access.row.mimeType,
        access.row.kind,
      ),
      filename: access.row.originalFilename,
    };
  } catch {
    return { ok: false, message: "ファイルの取得に失敗しました", httpStatus: 500 };
  }
}
