"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";

const VALID_ROLES = ["admin", "teacher", "readonly"] as const;
type Role = (typeof VALID_ROLES)[number];

async function requireAdmin(tenantSlug: string) {
  const session = await auth();
  if (!session?.user?.tenantId || !canAccessTenantRoute(session, tenantSlug)) {
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

export async function addUser(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const name = String(formData.get("name") ?? "").trim() || null;
  const role = (String(formData.get("role") ?? "teacher")) as Role;

  if (!email || !email.includes("@")) {
    return { ok: false, message: "有効なメールアドレスを入力してください" };
  }
  if (!VALID_ROLES.includes(role)) {
    return { ok: false, message: "不正なロールです" };
  }

  try {
    const session = await requireAdmin(tenantSlug);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.tenantId !== session.user.tenantId) {
        return { ok: false, message: "このメールアドレスは他の学校で使用されています" };
      }
      return { ok: false, message: "このメールアドレスはすでに登録されています" };
    }

    await prisma.user.create({
      data: {
        email,
        name: name ?? email.split("@")[0],
        tenantId: session.user.tenantId,
        tenantSlug,
        role: role as any,
      },
    });

    revalidatePath(`/t/${tenantSlug}/admin/users`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "登録に失敗しました" };
  }
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

export async function listCurriculumUnits() {
  return prisma.curriculumUnit.findMany({
    orderBy: [{ subject: "asc" }, { grade: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      schoolType: true,
      subject: true,
      grade: true,
      category: true,
      name: true,
      isActive: true,
      sortOrder: true,
    },
  });
}

export async function addCurriculumUnit(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const schoolType = String(formData.get("schoolType") ?? "junior_high");
  const subject = String(formData.get("subject") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;

  if (!subject || !grade || !name) {
    return { ok: false, message: "教科・学年・単元名は必須です" };
  }

  try {
    await requireAdmin(tenantSlug);

    await prisma.curriculumUnit.upsert({
      where: { schoolType_subject_grade_name: { schoolType, subject, grade, name } },
      create: { schoolType, subject, grade, name, category, aliases: [], sortOrder: 9999, isActive: true },
      update: { isActive: true, category },
    });

    revalidatePath(`/t/${tenantSlug}/admin/curriculum`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "追加に失敗しました" };
  }
}

export async function toggleCurriculumUnitActive(
  tenantSlug: string,
  unitId: string,
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await requireAdmin(tenantSlug);
    await prisma.curriculumUnit.update({
      where: { id: unitId },
      data: { isActive },
    });
    revalidatePath(`/t/${tenantSlug}/admin/curriculum`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "更新に失敗しました" };
  }
}

export async function getTenantSettings(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      schoolType: true,
      prefecture: true,
      googleHostedDomain: true,
    },
  });
}

export async function updateTenantSettings(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const schoolType = String(formData.get("schoolType") ?? "");
  const prefecture = String(formData.get("prefecture") ?? "").trim() || null;
  const googleHostedDomain =
    String(formData.get("googleHostedDomain") ?? "").trim() || null;

  if (!name) return { ok: false, message: "学校名は必須です" };

  try {
    const session = await requireAdmin(tenantSlug);
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: { name, schoolType: schoolType as any, prefecture, googleHostedDomain },
    });
    revalidatePath(`/t/${tenantSlug}/admin/settings`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "更新に失敗しました" };
  }
}
