import "server-only";

import { withTenantRls } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";

export async function getStats(tenantId: string) {
  return withTenantRls(tenantId, async (tx) => {
    const [totals, bySubject, bySubjectDetail, byAiIctSubjectDetail, byGrade, byMonth, byAuthor, topTags, byCategoryDetail] =
      await Promise.all([
        tx.$queryRaw<
          { total: bigint; this_month: bigint; active_authors: bigint }[]
        >`
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (
              WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
            ) AS this_month,
            COUNT(DISTINCT "authorId") FILTER (
              WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
            ) AS active_authors
          FROM "Post"
          WHERE "isPublished" = true
        `,

        tx.$queryRaw<{ subject: string; count: bigint }[]>`
          SELECT
            CASE
              WHEN TRIM(subject) = '' THEN '共通'
              ELSE TRIM(subject)
            END AS subject,
            COUNT(*) AS count
          FROM "Post"
          WHERE "isPublished" = true
            AND COALESCE(category, '授業') = '授業'
          GROUP BY 1
          ORDER BY count DESC
        `,

        tx.$queryRaw<
          {
            subject: string;
            count: bigint;
            this_month: bigint;
            author_count: bigint;
            latest_post_at: Date | null;
          }[]
        >`
          SELECT
            CASE
              WHEN TRIM(subject) = '' THEN '共通'
              ELSE TRIM(subject)
            END AS subject,
            COUNT(*) AS count,
            COUNT(*) FILTER (
              WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
            ) AS this_month,
            COUNT(DISTINCT "authorId") AS author_count,
            MAX("createdAt") AS latest_post_at
          FROM "Post"
          WHERE "isPublished" = true
            AND COALESCE(category, '授業') = '授業'
          GROUP BY 1
        `,

        tx.$queryRaw<
          {
            subject: string;
            count: bigint;
            this_month: bigint;
            author_count: bigint;
            latest_post_at: Date | null;
          }[]
        >`
          SELECT
            CASE
              WHEN category = '業務改善' THEN '業務改善'
              WHEN TRIM(subject) = '' THEN '共通'
              ELSE TRIM(subject)
            END AS subject,
            COUNT(*) AS count,
            COUNT(*) FILTER (
              WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
            ) AS this_month,
            COUNT(DISTINCT "authorId") AS author_count,
            MAX("createdAt") AS latest_post_at
          FROM "Post"
          WHERE "isPublished" = true
            AND (
              COALESCE(category, '授業') = 'AI・ICT活用'
              OR category = '業務改善'
            )
          GROUP BY 1
        `,

        tx.$queryRaw<{ grade: string; count: bigint }[]>`
          SELECT grade, COUNT(*) AS count
          FROM "Post"
          WHERE "isPublished" = true
            AND COALESCE(category, '授業') = '授業'
            AND TRIM(grade) <> ''
          GROUP BY grade
          ORDER BY grade ASC
        `,

        tx.$queryRaw<{ month: Date; count: bigint }[]>`
          SELECT DATE_TRUNC('month', "createdAt") AS month, COUNT(*) AS count
          FROM "Post"
          WHERE "isPublished" = true
            AND "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY 1
          ORDER BY 1 ASC
        `,

        tx.$queryRaw<{ authorId: string; count: bigint }[]>`
          SELECT "authorId", COUNT(*) AS count
          FROM "Post"
          WHERE "isPublished" = true
          GROUP BY "authorId"
          ORDER BY count DESC
          LIMIT 5
        `,

        tx.$queryRaw<{ name: string; count: bigint }[]>`
          SELECT t.name, COUNT(pt."postId") AS count
          FROM "PostTag" pt
          JOIN "Tag" t ON pt."tagId" = t.id
          JOIN "Post" p ON p.id = pt."postId"
          WHERE p."isPublished" = true
          GROUP BY t.id, t.name
          ORDER BY count DESC
          LIMIT 10
        `,

        tx.$queryRaw<
          {
            category: string;
            count: bigint;
            this_month: bigint;
            author_count: bigint;
          }[]
        >`
          SELECT
            COALESCE(category, '授業') AS category,
            COUNT(*) AS count,
            COUNT(*) FILTER (
              WHERE DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
            ) AS this_month,
            COUNT(DISTINCT "authorId") AS author_count
          FROM "Post"
          WHERE "isPublished" = true
          GROUP BY COALESCE(category, '授業')
        `,
      ]);

    const authorIds = byAuthor.map((r) => r.authorId);
    const authors =
      authorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    return {
      totals: {
        total: Number(totals[0]?.total ?? 0),
        thisMonth: Number(totals[0]?.this_month ?? 0),
        activeAuthors: Number(totals[0]?.active_authors ?? 0),
      },
      bySubject: bySubject.map((r) => ({
        subject: r.subject,
        count: Number(r.count),
      })),
      bySubjectDetail: bySubjectDetail.map((r) => ({
        subject: r.subject,
        count: Number(r.count),
        thisMonth: Number(r.this_month),
        authorCount: Number(r.author_count),
        latestPostAt: r.latest_post_at,
      })),
      byAiIctSubjectDetail: byAiIctSubjectDetail.map((r) => ({
        subject: r.subject,
        count: Number(r.count),
        thisMonth: Number(r.this_month),
        authorCount: Number(r.author_count),
        latestPostAt: r.latest_post_at,
      })),
      byGrade: byGrade.map((r) => ({
        grade: r.grade,
        count: Number(r.count),
      })),
      byMonth: byMonth.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
      topAuthors: byAuthor.map((r) => ({
        author: authorMap.get(r.authorId) ?? null,
        count: Number(r.count),
      })),
      topTags: topTags.map((r) => ({ name: r.name, count: Number(r.count) })),
      byCategoryDetail: byCategoryDetail.map((r) => ({
        category: r.category,
        count: Number(r.count),
        thisMonth: Number(r.this_month),
        authorCount: Number(r.author_count),
      })),
    };
  });
}
