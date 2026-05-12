import { handlers } from "@/auth";
import { APP_BASE_PATH } from "@/lib/app-base-path";
import { NextRequest } from "next/server";

/**
 * Next.js の `basePath` により、ここに届く `req.url` の pathname は `/api/auth/...` のみに
 * 正規化される。Auth.js の `basePath` は `/jugyobase/api/auth` なので、パース前にフルパスへ
 * 合わせる（UnknownAction: /api/auth/callback/google を防ぐ）。
 */
function withAppBasePath(req: NextRequest): NextRequest {
  const u = new URL(req.url);
  if (u.pathname.startsWith("/api/auth") && !u.pathname.startsWith(`${APP_BASE_PATH}/`)) {
    u.pathname = `${APP_BASE_PATH}${u.pathname}`;
  }
  if (req.method === "GET" || req.method === "HEAD") {
    return new NextRequest(u.toString(), { method: req.method, headers: req.headers });
  }
  return new NextRequest(u.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.body,
    duplex: "half",
  } as ConstructorParameters<typeof NextRequest>[1]);
}

export async function GET(req: NextRequest) {
  return handlers.GET(withAppBasePath(req));
}

export async function POST(req: NextRequest) {
  return handlers.POST(withAppBasePath(req));
}
