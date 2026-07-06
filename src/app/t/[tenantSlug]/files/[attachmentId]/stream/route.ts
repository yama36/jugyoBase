import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { streamAttachmentObject } from "@/app/actions/attachments";

/** PDF 埋め込み時は filename 付きだとブラウザがダウンロード扱いにすることがある */
function contentDispositionForStream(
  kind: string,
  filename: string,
): string | undefined {
  if (kind === "pdf") {
    return "inline";
  }
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
  const contentType =
    r.kind === "pdf" ? "application/pdf" : r.contentType;
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": "private, no-store",
  };
  const disposition = contentDispositionForStream(r.kind, r.filename);
  if (disposition) {
    headers["Content-Disposition"] = disposition;
  }
  if (typeof r.contentLength === "number") {
    headers["Content-Length"] = String(r.contentLength);
  }

  return new NextResponse(webStream, { headers });
}
