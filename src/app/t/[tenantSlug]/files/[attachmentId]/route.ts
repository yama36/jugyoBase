import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { getAttachmentDownloadUrl, streamAttachmentObject } from "@/app/actions/posts";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ tenantSlug: string; attachmentId: string }> },
) {
  const { tenantSlug, attachmentId } = await ctx.params;
  const url = new URL(req.url);
  const isThumb = url.searchParams.get("thumb") === "1";

  if (isThumb) {
    const streamed = await streamAttachmentObject(tenantSlug, attachmentId);
    if (!streamed.ok) {
      const status =
        typeof streamed.httpStatus === "number" && streamed.httpStatus >= 400
          ? streamed.httpStatus
          : 404;
      return new NextResponse(streamed.message, {
        status,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    const webStream = Readable.toWeb(streamed.body) as ReadableStream<Uint8Array>;
    return new NextResponse(webStream, {
      headers: {
        "Content-Type": streamed.contentType,
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
