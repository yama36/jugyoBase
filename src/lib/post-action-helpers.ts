import "server-only";

import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { subjectRequiredForCategory } from "@/lib/post-category";
import { isCommonGradeOrSubjectSelection } from "@/lib/subject-grade-options";
import {
  isAiIctLessonChecked,
  parseTransferSkillOrigins,
  TRANSFER_SKILL_ORIGIN_OPTIONS,
} from "@/lib/transfer-reflection";

const CLASSROOM_CATEGORY = "授業" as const;

const transferReflectionFields = {
  isAiIctLesson: z.boolean(),
  transferStrength: z.string().max(5000).optional().nullable(),
  transferSkillOrigins: z.array(z.enum(TRANSFER_SKILL_ORIGIN_OPTIONS)),
  transferSkillOriginOther: z.string().max(500).optional().nullable(),
  transferMotivation: z.string().max(5000).optional().nullable(),
};

function refineTransferReflection(
  data: {
    category: string;
    isAiIctLesson: boolean;
    transferStrength?: string | null;
    transferSkillOrigins: string[];
    transferSkillOriginOther?: string | null;
    transferMotivation?: string | null;
  },
  ctx: z.RefinementCtx,
  options: { requireWhenAiLesson: boolean },
) {
  if (data.isAiIctLesson && data.category !== CLASSROOM_CATEGORY) {
    ctx.addIssue({
      code: "custom",
      message: "AI/ICT活用授業の振り返りは「授業」カテゴリでのみ利用できます",
      path: ["isAiIctLesson"],
    });
    return;
  }
  if (!data.isAiIctLesson || !options.requireWhenAiLesson) return;

  if (!data.transferStrength?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "工夫できた・うまく使えたと感じる力を入力してください",
      path: ["transferStrength"],
    });
  }
  if (data.transferSkillOrigins.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "力を身につけた場面を1つ以上選択してください",
      path: ["transferSkillOrigins"],
    });
  }
  if (
    data.transferSkillOrigins.includes("その他") &&
    !data.transferSkillOriginOther?.trim()
  ) {
    ctx.addIssue({
      code: "custom",
      message: "「その他」を選んだ場合は補足を入力してください",
      path: ["transferSkillOriginOther"],
    });
  }
  if (!data.transferMotivation?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "なぜこの授業でその力・AI活用を使おうと思ったかを入力してください",
      path: ["transferMotivation"],
    });
  }
}

export const postFields = z
  .object({
    tenantSlug: z.string().min(1),
    category: z.enum(["授業", "AI・ICT活用"]),
    title: z.string().max(200).optional().nullable(),
    grade: z.string().max(80),
    subject: z.string().max(80),
    unit: z.string().max(500),
    contentItem: z.string().max(500).optional().nullable(),
    aim: z.string().max(5000).optional().nullable(),
    reflection: z.string().max(20000).optional().nullable(),
    point: z.string().max(20000).optional().nullable(),
    flow: z.string().max(20000).optional().nullable(),
    referenceUrl: z.string().url().max(2000).optional().nullable(),
    hashtagsRaw: z.string().max(2000).optional().nullable(),
    ...transferReflectionFields,
    isDraft: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const isClassroomCategory = data.category === "授業";
    if (isClassroomCategory && !data.grade.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "学年を選択してください",
        path: ["grade"],
      });
    }
    if (subjectRequiredForCategory(data.category) && !data.subject.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "教科を選択してください",
        path: ["subject"],
      });
    }
    if (
      isClassroomCategory &&
      data.grade.trim() &&
      data.subject.trim() &&
      !isCommonGradeOrSubjectSelection(data.grade, data.subject) &&
      !data.unit.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "単元を入力してください",
        path: ["unit"],
      });
    }
    refineTransferReflection(data, ctx, {
      requireWhenAiLesson: !data.isDraft,
    });
  });

export const autosaveDraftFields = z.object({
  tenantSlug: z.string().min(1),
  postId: z.string().min(1),
  category: z.enum(["授業", "AI・ICT活用"]),
  title: z.string().max(200).optional().nullable(),
  grade: z.string().max(80),
  subject: z.string().max(80),
  unit: z.string().max(500),
  contentItem: z.string().max(500).optional().nullable(),
  aim: z.string().max(5000).optional().nullable(),
  reflection: z.string().max(20000).optional().nullable(),
  point: z.string().max(20000).optional().nullable(),
  flow: z.string().max(20000).optional().nullable(),
  referenceUrl: z.string().max(2000).optional().nullable(),
  hashtagsRaw: z.string().max(2000).optional().nullable(),
  ...transferReflectionFields,
});

export function parsePostFormInput(formData: FormData, options?: { isDraft?: boolean }) {
  const isDraft =
    options?.isDraft ?? formData.get("isDraft") === "on";
  const category = String(formData.get("category") ?? CLASSROOM_CATEGORY);
  const isClassroomCategory = category === CLASSROOM_CATEGORY;
  const isAiIctLesson =
    isClassroomCategory && isAiIctLessonChecked(formData.get("isAiIctLesson"));
  const transferSkillOrigins = isAiIctLesson
    ? parseTransferSkillOrigins(formData.getAll("transferSkillOrigins"))
    : [];
  const includesOther = transferSkillOrigins.includes("その他");

  return {
    tenantSlug: formData.get("tenantSlug"),
    category,
    title: formData.get("title") || null,
    grade: String(formData.get("grade") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    unit: String(formData.get("unit") ?? "").trim(),
    contentItem: formData.get("contentItem") || null,
    aim: formData.get("aim") || null,
    reflection: formData.get("reflection") || null,
    point: formData.get("point"),
    flow: formData.get("flow"),
    referenceUrl: formData.get("referenceUrl") || null,
    hashtagsRaw: formData.get("hashtags") || null,
    isAiIctLesson,
    transferStrength: isAiIctLesson ? formData.get("transferStrength") || null : null,
    transferSkillOrigins,
    transferSkillOriginOther:
      isAiIctLesson && includesOther
        ? formData.get("transferSkillOriginOther") || null
        : null,
    transferMotivation: isAiIctLesson ? formData.get("transferMotivation") || null : null,
    isDraft,
  };
}

export function transferReflectionDbData(data: {
  isAiIctLesson: boolean;
  transferStrength?: string | null;
  transferSkillOrigins: string[];
  transferSkillOriginOther?: string | null;
  transferMotivation?: string | null;
}) {
  if (!data.isAiIctLesson) {
    return {
      isAiIctLesson: false,
      transferStrength: null,
      transferSkillOrigins: [],
      transferSkillOriginOther: null,
      transferMotivation: null,
    };
  }
  const includesOther = data.transferSkillOrigins.includes("その他");
  return {
    isAiIctLesson: true,
    transferStrength: data.transferStrength?.trim() || null,
    transferSkillOrigins: data.transferSkillOrigins,
    transferSkillOriginOther: includesOther
      ? data.transferSkillOriginOther?.trim() || null
      : null,
    transferMotivation: data.transferMotivation?.trim() || null,
  };
}

export function normalizeAutosaveReferenceUrl(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  try {
    new URL(s);
    return s;
  } catch {
    return null;
  }
}

export async function ensureCurriculumUnitOption(input: {
  grade: string;
  subject: string;
  unit: string;
}) {
  const grade = input.grade.trim();
  const subject = input.subject.trim();
  const unit = input.unit.trim();
  if (!grade || !subject || !unit) return;

  const delegate = (prisma as unknown as { curriculumUnit?: { upsert: (args: unknown) => Promise<unknown> } })
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

export async function syncPostTags(
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

export function policyOk(formData: FormData): boolean {
  const v = formData.get("policyAccepted");
  return v === "on" || v === "true";
}