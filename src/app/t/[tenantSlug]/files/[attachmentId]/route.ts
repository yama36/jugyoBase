import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import sharp from "sharp";
import { getAttachmentDownloadUrl, streamAttachmentObject } from "@/app/actions/posts";

async function readableToBuffer(body: import("stream").Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

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

    const input = await readableToBuffer(streamed.body);

    if (streamed.kind === "image") {
      try {
        const resized = await sharp(input)
          .resize({ width: 192, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        return new NextResponse(new Uint8Array(resized), {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "private, max-age=31536000, immutable",
          },
        });
      } catch {
        return new NextResponse(new Uint8Array(input), {
          headers: {
            "Content-Type": streamed.contentType,
            "Cache-Control": "private, max-age=31536000, immutable",
          },
        });
      }
    }

    return new NextResponse(new Uint8Array(input), {
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
