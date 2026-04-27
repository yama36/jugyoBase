import { NextResponse } from "next/server";
import { getAttachmentDownloadUrl } from "@/app/actions/posts";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tenantSlug: string; attachmentId: string }> },
) {
  const { tenantSlug, attachmentId } = await ctx.params;
  const r = await getAttachmentDownloadUrl(tenantSlug, attachmentId);
  if (!r.ok) {
    return new NextResponse(r.message, { status: 404 });
  }
  return NextResponse.redirect(r.url);
}
