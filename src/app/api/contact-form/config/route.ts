import { NextResponse } from "next/server";
import { getContactFormUpstreamConfigUrl } from "@/lib/contact-form-upstream";

/** ブラウザ CORS 回避: identfill 同一オリジンから yamalog の設定 API へ中継 */
export async function GET() {
  try {
    const res = await fetch(getContactFormUpstreamConfigUrl(), {
      method: "GET",
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "application/json; charset=utf-8",
      },
    });
  } catch (e) {
    console.error("contact-form config proxy", e);
    return NextResponse.json({ message: "設定の取得に失敗しました。" }, { status: 502 });
  }
}
