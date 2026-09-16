import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === "1" ? { output: "export" as const, trailingSlash: true } : {}),
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: { unoptimized: true },
};

export default nextConfig;
