import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { APP_BASE_PATH } from "./src/lib/app-base-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
