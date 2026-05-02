"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const VALID_ROLES = ["admin", "teacher", "readonly"] as const;
type Role = (typeof VALID_ROLES)[number];

async function requireAdmin(tenantSlug: string) {
  const session = await auth();
  if (!session?.user?.tenantId || session.user.tenantSlug !== tenantSlug) {
    throw new Error("認証が必要です");
  }
  if (session.user.role !== "admin") {
    throw new Error("管理者権限が必要です");
  }
  return session;
}

export async function listTenantUsers(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export async function updateUserRole(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as Role;

  if (!VALID_ROLES.includes(role)) {
    return { ok: false, message: "不正なロールです" };
  }

  try {
    const session = await requireAdmin(tenantSlug);
    if (userId === session.user.id) {
      return { ok: false, message: "自分自身のロールは変更できません" };
    }
    await prisma.user.update({
      where: { id: userId, tenantId: session.user.tenantId },
      data: { role: role as any },
    });
    revalidatePath(`/t/${tenantSlug}/admin/users`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "更新に失敗しました" };
  }
}

export async function removeUser(
  tenantSlug: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const session = await requireAdmin(tenantSlug);
    if (userId === session.user.id) {
      return { ok: false, message: "自分自身は削除できません" };
    }
    await prisma.user.delete({
      where: { id: userId, tenantId: session.user.tenantId },
    });
    revalidatePath(`/t/${tenantSlug}/admin/users`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "削除に失敗しました" };
  }
}
