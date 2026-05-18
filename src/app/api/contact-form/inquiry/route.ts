import { NextResponse } from "next/server";
import { getContactFormUpstreamInquiryUrl } from "@/lib/contact-form-upstream";

/** ブラウザ CORS 回避: identfill 同一オリジンから yamalog の送信 API へ中継 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ success: false, message: "Content-Type must be application/json" }, { status: 415 });
  }

  let body: string;
  try {
    body = await req.text();
  } catch (e) {
    console.error("contact-form inquiry proxy: read body", e);
    return NextResponse.json({ success: false, message: "invalid body" }, { status: 400 });
  }

  try {
    const res = await fetch(getContactFormUpstreamInquiryUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json; charset=utf-8",
      },
    });
  } catch (e) {
    console.error("contact-form inquiry proxy", e);
    return NextResponse.json({ success: false, message: "送信に失敗しました。" }, { status: 502 });
  }
}
