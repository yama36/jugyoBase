"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const SUBJECT_OPTIONS = [
  "国語","社会","数学","理科","音楽","美術",
  "保健体育","技術","家庭","英語","道徳","学活","総合",
] as const;

const GRADE_OPTIONS = ["1年", "2年", "3年"] as const;

export async function getMyProfile() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true,
      bio: true, position: true,
      subjects: true, grades: true,
    },
  });
}

export async function updateProfile(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: "認証が必要です" };

  const name = String(formData.get("name") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const subjects = formData.getAll("subjects").map(String).filter(Boolean);
  const grades = formData.getAll("grades").map(String).filter(Boolean);

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, bio, position, subjects, grades } as any,
    });
    revalidatePath(`/t/${session.user.tenantSlug}/mypage`);
    revalidatePath(`/t/${session.user.tenantSlug}/profile/edit`);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, message: "更新に失敗しました" };
  }
}

export { SUBJECT_OPTIONS, GRADE_OPTIONS };
