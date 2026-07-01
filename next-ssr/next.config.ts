import type { NextConfig } from "next";
import path from "path";

const SPA_HOST = process.env.SPA_ENDPOINT || "http://medingen-in-new-2025.s3-website.ap-south-1.amazonaws.com";
const API_HOST = process.env.API_ENDPOINT || "https://medingen.in/api/";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/medicine/:slug",
        destination: "/product/:slug",
        permanent: true,
      },
      {
        source: "/category",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/category/:slug*",
        destination: "/categories/:slug*",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/searchbox",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1dh0rr5xj2p49.cloudfront.net",
        pathname: "/**",
      },
    ],
  },
  webpack(config) {
    config.resolve.alias["react-router-dom"] = path.resolve(process.cwd(), "legacy/shims/react-router-dom.tsx");
    config.resolve.alias["dompurify"] = path.resolve(process.cwd(), "legacy/shims/dompurify.ts");
    return config;
  },
  turbopack: {
    root: path.resolve(process.cwd()),
    resolveAlias: {
      "react-router-dom": "./legacy/shims/react-router-dom.tsx",
      "dompurify": "./legacy/shims/dompurify.ts",
    },
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Proxy Cloudfront CDN resources to bypass CORS policy restrictions
        {
          source: "/cloudfront-cdn/:path*",
          destination: "https://d1dh0rr5xj2p49.cloudfront.net/:path*",
        },
        // Route API endpoints to the Flask API
        {
          source: "/api/:path*",
          destination: `${API_HOST}:path*`,
        },
      ],
      afterFiles: [],
      fallback: [
        // Serve non-migrated routes & build assets (like JS, CSS, images) from the legacy SPA host
        {
          source: "/:path*",
          destination: `${SPA_HOST}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
