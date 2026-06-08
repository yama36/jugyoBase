import { auth } from "@/auth";
import { buildCsvRow } from "@/lib/csv";
import { withTenantRls } from "@/lib/prisma-tenant";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";

const CSV_HEADERS = [
  "投稿ID",
  "投稿者ID",
  "投稿者名",
  "投稿者メール",
  "投稿日時",
  "更新日時",
  "公開状態",
  "カテゴリ",
  "タイトル",
  "学年",
  "教科",
  "単元",
  "内容項目",
  "めあて",
  "振り返り",
  "工夫した点",
  "授業の流れ",
  "AI/ICT活用授業フラグ",
  "工夫できた力",
  "力の身につけた場面",
  "場面（その他補足）",
  "AI活用の動機",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const { tenantSlug } = await params;
  const session = await auth();

  if (!canAccessTenantRoute(session, tenantSlug, { requireTenantId: true })) {
    return new Response("認証が必要です", { status: 401 });
  }
  if (!session?.user || session.user.role !== "admin") {
    return new Response("管理者権限が必要です", { status: 403 });
  }

  const tenantId = session.user.tenantId;
  const posts = await withTenantRls(tenantId, (tx) =>
    tx.post.findMany({
      where: {
        isAiIctLesson: true,
        isPublished: true,
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    }),
  );

  const lines = [
    buildCsvRow([...CSV_HEADERS]),
    ...posts.map((post) =>
      buildCsvRow([
        post.id,
        post.author.id,
        post.author.name ?? "",
        post.author.email,
        post.createdAt.toISOString(),
        post.updatedAt.toISOString(),
        post.isPublished ? "公開" : "下書き",
        post.category,
        post.title ?? "",
        post.grade,
        post.subject,
        post.unit,
        post.contentItem ?? "",
        post.aim,
        post.reflection ?? "",
        post.point ?? "",
        post.flow ?? "",
        post.isAiIctLesson ? "はい" : "いいえ",
        post.transferStrength ?? "",
        post.transferSkillOrigins.join("、"),
        post.transferSkillOriginOther ?? "",
        post.transferMotivation ?? "",
      ]),
    ),
  ];

  const body = `\uFEFF${lines.join("\r\n")}`;
  const filename = `jugyobase-ai-lesson-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
