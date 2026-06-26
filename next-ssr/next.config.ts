import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1dh0rr5xj2p49.cloudfront.net",
        port: "",
        pathname: "/**",
      },
    ],
    unoptimized: true, // Disables default image optimization if needed, or keep it enabled. Since we use custom sizes/loaders, enabling is good but unoptimized: true is safer. Let's keep it optimized first.
  },
};

export default nextConfig;
