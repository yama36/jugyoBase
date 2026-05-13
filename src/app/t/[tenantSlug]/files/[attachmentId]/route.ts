import { NextResponse } from "next/server";
import { getAttachmentDownloadUrl } from "@/app/actions/posts";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tenantSlug: string; attachmentId: string }> },
) {
  const { tenantSlug, attachmentId } = await ctx.params;
  const r = await getAttachmentDownloadUrl(tenantSlug, attachmentId);
  if (!r.ok) {
    const status =
      typeof r.httpStatus === "number" && r.httpStatus >= 400
        ? r.httpStatus
        : 404;
    return new NextResponse(r.message, {
      status,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  return NextResponse.redirect(r.url);
}
