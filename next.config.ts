import type { NextConfig } from "next";
import { APP_BASE_PATH } from "./src/lib/app-base-path";

const nextConfig: NextConfig = {
  basePath: APP_BASE_PATH,
};

export default nextConfig;
