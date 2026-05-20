import type { MetadataRoute } from "next";

/** basePath 配下はすべてクロール対象外（/jugyobase/robots.txt として配信） */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
