"use server";

import { revalidatePath } from "next/cache";
import type { AttachmentKind } from "@prisma/client";
import { auth } from "@/auth";
import { withTenantRls } from "@/lib/prisma-tenant";
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
import { getPost } from "@/lib/queries/posts";
import {
  ATTACHMENT_THUMB_CONTENT_TYPE,
  buildAttachmentThumbStorageKey,
  getOrCreateAttachmentThumb,
  isThumbGeneratableKind,
} from "@/lib/attachment-thumbnail";

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

export async function deleteAttachment(input: {
  tenantSlug: string;
  postId: string;
  attachmentId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !canAccessTenantRoute(session, input.tenantSlug)) {
    return { ok: false, message: "未ログインです" };
  }

  const tenantId = session.user.tenantId;
  const post = await getPost(tenantId, input.postId);
  if (
    !post ||
    (post.authorId !== session.user.id && session.user.role !== "admin")
  ) {
    return { ok: false, message: "削除する権限がありません" };
  }

  const attachment = post.attachments.find((a) => a.id === input.attachmentId);
  if (!attachment) {
    return { ok: false, message: "添付が見つかりません" };
  }

  if (isS3Configured()) {
    try {
      await deleteObject(attachment.storageKey);
      await deleteObject(
        buildAttachmentThumbStorageKey(tenantId, input.postId, input.attachmentId),
      );
    } catch {
      // DB 削除は続行（孤立オブジェクトは運用で掃除）
    }
  }

  try {
    await withTenantRls(tenantId, (tx) =>
      tx.attachment.delete({ where: { id: input.attachmentId } }),
    );
    revalidatePath(`/t/${input.tenantSlug}/posts/${input.postId}`);
    revalidatePath(`/t/${input.tenantSlug}/posts/${input.postId}/edit`);
    revalidatePath(`/t/${input.tenantSlug}/posts/new`);
    revalidatePath(`/t/${input.tenantSlug}/mypage`);
    return { ok: true };
  } catch {
    return { ok: false, message: "削除に失敗しました" };
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
      kind: AttachmentKind;
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
      kind: access.row.kind,
    };
  } catch {
    return { ok: false, message: "ファイルの取得に失敗しました", httpStatus: 500 };
  }
}

export async function getAttachmentThumb(
  tenantSlug: string,
  attachmentId: string,
): Promise<
  | { ok: true; body: Buffer; contentType: string }
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

  const { row, tenantId } = access;
  if (!isThumbGeneratableKind(row.kind)) {
    return { ok: false, message: "サムネイル非対応", httpStatus: 404 };
  }

  try {
    const body = await getOrCreateAttachmentThumb({
      tenantId,
      postId: row.postId,
      attachmentId,
      kind: row.kind,
      originalStorageKey: row.storageKey,
      originalFilename: row.originalFilename,
    });
    return { ok: true, body, contentType: ATTACHMENT_THUMB_CONTENT_TYPE };
  } catch {
    return {
      ok: false,
      message: "サムネイルの生成に失敗しました",
      httpStatus: 500,
    };
  }
}
