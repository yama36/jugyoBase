import Link from "next/link";
import { redirect } from "next/navigation";
import { canAccessTenantRoute } from "@/lib/tenant-route-access";
import { auth } from "@/auth";
import { listNotifications, markAllAsRead } from "@/app/actions/notifications";
import { prisma } from "@/lib/prisma";

const TYPE_LABEL: Record<string, string> = {
  comment: "がコメントしました",
  like: "がいいねしました",
  mention: "がメンションしました",
};

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const session = await auth();

  if (!canAccessTenantRoute(session, tenantSlug, { requireUserId: true })) {
    redirect(`/t/${tenantSlug}/login`);
  }
  if (!session?.user?.id) {
    redirect(`/t/${tenantSlug}/login`);
  }

  const notifications = await listNotifications(session.user.id);

  const actorIds = [
    ...new Set(notifications.filter((n) => n.actorId).map((n) => n.actorId!)),
  ];
  const actors =
    actorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
  const actorMap = new Map(actors.map((a) => [a.id, a]));

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">通知</h1>
          <p className="mt-1 text-sm text-zinc-600">
            コメント・いいねの通知が届きます
          </p>
        </div>
        {hasUnread ? (
          <form action={markAllAsRead.bind(null, tenantSlug)}>
            <button
              type="submit"
              className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50"
            >
              全て既読にする
            </button>
          </form>
        ) : null}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          通知はまだありません
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => {
            const actor = n.actorId ? actorMap.get(n.actorId) : null;
            const actorName = actor?.name ?? actor?.email ?? "誰か";
            const postTitle = n.post?.title?.trim() || "（無題）";
            const postHref =
              n.post ? `/t/${tenantSlug}/posts/${n.post.id}` : null;

            return (
              <li
                key={n.id}
                className={`rounded-lg border p-4 text-sm transition ${
                  n.isRead
                    ? "border-zinc-200 bg-white text-zinc-600"
                    : "border-sky-200 bg-sky-50 text-zinc-800"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p>
                    <span className="font-medium">{actorName}</span>
                    {TYPE_LABEL[n.type] ?? ""}
                    {postHref ? (
                      <>
                        {" ― "}
                        <Link
                          href={postHref}
                          className="text-sky-700 underline-offset-2 hover:underline"
                        >
                          {postTitle}
                        </Link>
                      </>
                    ) : null}
                    {!n.isRead ? (
                      <span className="ml-2 inline-block rounded-full bg-sky-500 px-1.5 py-0.5 text-xs font-medium text-white">
                        新着
                      </span>
                    ) : null}
                  </p>
                  <time
                    dateTime={n.createdAt.toISOString()}
                    className="shrink-0 text-xs text-zinc-400"
                  >
                    {n.createdAt.toLocaleString("ja-JP")}
                  </time>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
