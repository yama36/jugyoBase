import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { APP_BASE_PATH } from "./src/lib/app-base-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
  // /help 配下で MDX をセクション分割して import するため拡張子を許可。
  // 現状 .mdx をルートとして配置する予定はないが、Next.js の MDX 利用要件として宣言しておく。
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
