import "server-only";

import type { Prisma } from "@prisma/client";
import { withTenantRls } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";
import {
  AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT,
  COMMON_GRADE_SUBJECT_LABEL,
} from "@/lib/subject-grade-options";
import {
  clampPostListPage,
  totalPostListPages,
} from "@/lib/post-list-pagination";
import {
  AI_ICT_CATEGORY,
  LEGACY_BUSINESS_IMPROVEMENT_CATEGORY,
} from "@/lib/post-category";

export type PostSearchParams = {
  q?: string;
  grade?: string;
  subject?: string;
  unit?: string;
  tag?: string;
  category?: string;
  authorId?: string;
  includeDrafts?: boolean;
  page?: number;
  perPage?: number;
};

export type PostListPageResult = {
  posts: PostListItem[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function buildPostListWhereInput(params: PostSearchParams): Prisma.PostWhereInput {
  const q = params.q?.trim();
  const tag = params.tag?.trim().toLowerCase();

  const filters: Prisma.PostWhereInput[] = [];
  if (!params.includeDrafts) filters.push({ isPublished: true });
  if (params.grade) filters.push({ grade: params.grade });
  if (params.subject) {
    if (params.subject === COMMON_GRADE_SUBJECT_LABEL) {
      filters.push({
        OR: [{ subject: COMMON_GRADE_SUBJECT_LABEL }, { subject: "" }],
      });
    } else {
      filters.push({ subject: params.subject });
    }
  }
  if (params.category) {
    if (params.category === LEGACY_BUSINESS_IMPROVEMENT_CATEGORY) {
      filters.push({ category: AI_ICT_CATEGORY });
      filters.push({ subject: AI_ICT_BUSINESS_IMPROVEMENT_SUBJECT });
    } else {
      filters.push({ category: params.category });
    }
  }
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

  return filters.length ? { AND: filters } : {};
}

async function enrichPostsWithCurriculumOptions(
  tx: Parameters<Parameters<typeof withTenantRls>[1]>[0],
  posts: Prisma.PostGetPayload<{ include: typeof postListInclude }>[],
): Promise<PostListItem[]> {
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
}

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
  const where = buildPostListWhereInput(params);

  return withTenantRls(tenantId, async (tx) => {
    const posts = await tx.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: postListInclude,
    });

    return enrichPostsWithCurriculumOptions(tx, posts);
  });
}

export async function listPostsPage(
  tenantId: string,
  params: PostSearchParams & { page: number; perPage: number },
): Promise<PostListPageResult> {
  const where = buildPostListWhereInput(params);
  const requestedPage = params.page;
  const perPage = params.perPage;

  return withTenantRls(tenantId, async (tx) => {
    const totalCount = await tx.post.count({ where });
    const totalPages = totalPostListPages(totalCount, perPage);
    const page = clampPostListPage(requestedPage, totalPages);
    const skip = (page - 1) * perPage;

    const posts = await tx.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: postListInclude,
      skip,
      take: perPage,
    });

    return {
      posts: await enrichPostsWithCurriculumOptions(tx, posts),
      totalCount,
      page,
      perPage,
      totalPages,
    };
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
