import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { APP_BASE_PATH } from "./src/lib/app-base-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
  output: "standalone",
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive, nosnippet",
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
