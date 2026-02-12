import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  basePath: "/cortina-2",
  assetPrefix: "/cortina-2/",
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
