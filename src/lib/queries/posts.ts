import "server-only";

import type { Prisma } from "@prisma/client";
import { withTenantRls } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";

export type PostSearchParams = {
  q?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  tag?: string;
  category?: string;
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

const postListInclude = {
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
  _count: { select: { likes: true, tried: true, comments: true } },
} satisfies Prisma.PostInclude;

export type PostListItem = Prisma.PostGetPayload<{
  include: typeof postListInclude;
}> & { hasCurriculumUnitOptions: boolean };

const postDetailInclude = {
  author: { select: { id: true, name: true, image: true, email: true } },
  tags: { include: { tag: true } },
  attachments: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.PostInclude;

export type PostDetail = Prisma.PostGetPayload<{
  include: typeof postDetailInclude;
}> & { hasCurriculumUnitOptions: boolean };

export async function listPosts(
  tenantId: string,
  params: PostSearchParams,
): Promise<PostListItem[]> {
  const q = params.q?.trim();
  const tag = params.tag?.trim().toLowerCase();

  const filters: Prisma.PostWhereInput[] = [];
  if (!params.includeDrafts) filters.push({ isPublished: true });
  if (params.grade) filters.push({ grade: params.grade });
  if (params.subject) filters.push({ subject: params.subject });
  if (params.category) filters.push({ category: params.category });
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

  return withTenantRls(tenantId, async (tx) => {
    const posts = await tx.post.findMany({
      where: filters.length ? { AND: filters } : {},
      orderBy: { createdAt: "desc" },
      include: postListInclude,
    });

    const pairs = Array.from(
      new Set(
        posts
          .filter((post) => post.grade.trim() && post.subject.trim())
          .map((post) => `${post.grade}:::${post.subject}`),
      ),
    ).map((key) => {
      const [grade, subject] = key.split(":::");
      return { grade, subject };
    });
    if (pairs.length === 0) {
      return posts.map((post) => ({ ...post, hasCurriculumUnitOptions: false })) as PostListItem[];
    }
    const curriculumPairs = await tx.curriculumUnit.findMany({
      where: {
        schoolType: "junior_high",
        isActive: true,
        OR: pairs,
      },
      select: { grade: true, subject: true },
      distinct: ["grade", "subject"],
    });
    const curriculumPairSet = new Set(
      curriculumPairs.map((pair) => `${pair.grade}:::${pair.subject}`),
    );

    return posts.map((post) => ({
      ...post,
      hasCurriculumUnitOptions: curriculumPairSet.has(`${post.grade}:::${post.subject}`),
    })) as PostListItem[];
  });
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
  const delegate = (prisma as unknown as { curriculumUnit?: { findMany: (args: unknown) => Promise<unknown> } })
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

export async function getPost(tenantId: string, postId: string): Promise<PostDetail | null> {
  return withTenantRls(tenantId, async (tx) => {
    const post = await tx.post.findUnique({
      where: { id: postId },
      include: postDetailInclude,
    });
    if (!post || !post.grade.trim() || !post.subject.trim()) {
      return post
        ? ({ ...post, hasCurriculumUnitOptions: false } as PostDetail)
        : null;
    }
    const unitCount = await tx.curriculumUnit.count({
      where: {
        schoolType: "junior_high",
        isActive: true,
        grade: post.grade,
        subject: post.subject,
      },
    });
    return { ...post, hasCurriculumUnitOptions: unitCount > 0 } as PostDetail;
  });
}
