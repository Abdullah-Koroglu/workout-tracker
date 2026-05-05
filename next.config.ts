import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: false,
  serverExternalPackages: ["iyzipay"],
};

export default nextConfig;
