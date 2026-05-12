"use server";

import { withTenantRls } from "@/lib/prisma-tenant";
import { prisma } from "@/lib/prisma";

export async function getStats(tenantId: string) {
  return withTenantRls(tenantId, async (tx) => {
    const [totals, bySubject, byGrade, byMonth, byAuthor, topTags] =
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
          SELECT subject, COUNT(*) AS count
          FROM "Post"
          WHERE "isPublished" = true
          GROUP BY subject
          ORDER BY count DESC
        `,

        tx.$queryRaw<{ grade: string; count: bigint }[]>`
          SELECT grade, COUNT(*) AS count
          FROM "Post"
          WHERE "isPublished" = true
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
          GROUP BY t.id, t.name
          ORDER BY count DESC
          LIMIT 10
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
    };
  });
}
