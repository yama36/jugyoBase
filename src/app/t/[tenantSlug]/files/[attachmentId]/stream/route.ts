import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { streamAttachmentObject } from "@/app/actions/posts";

function contentDispositionInline(filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7E]/g, "_") || "attachment";
  return `inline; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tenantSlug: string; attachmentId: string }> },
) {
  const { tenantSlug, attachmentId } = await ctx.params;
  const r = await streamAttachmentObject(tenantSlug, attachmentId);
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

  const webStream = Readable.toWeb(r.body) as ReadableStream<Uint8Array>;
  const headers: Record<string, string> = {
    "Content-Type": r.contentType,
    "Content-Disposition": contentDispositionInline(r.filename),
    "Cache-Control": "private, no-store",
  };
  if (typeof r.contentLength === "number") {
    headers["Content-Length"] = String(r.contentLength);
  }

  return new NextResponse(webStream, { headers });
}
