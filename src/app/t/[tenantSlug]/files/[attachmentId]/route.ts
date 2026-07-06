import { NextResponse } from "next/server";
import { getAttachmentDownloadUrl, getAttachmentThumb } from "@/app/actions/attachments";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ tenantSlug: string; attachmentId: string }> },
) {
  const { tenantSlug, attachmentId } = await ctx.params;
  const url = new URL(req.url);
  const isThumb = url.searchParams.get("thumb") === "1";

  if (isThumb) {
    const thumb = await getAttachmentThumb(tenantSlug, attachmentId);
    if (!thumb.ok) {
      const status =
        typeof thumb.httpStatus === "number" && thumb.httpStatus >= 400
          ? thumb.httpStatus
          : 404;
      return new NextResponse(thumb.message, {
        status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    return new NextResponse(new Uint8Array(thumb.body), {
      headers: {
        "Content-Type": thumb.contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  }

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
