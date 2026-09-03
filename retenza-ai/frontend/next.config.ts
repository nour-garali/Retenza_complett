import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // Les routes API Next.js (ex: /api/chatbot/stream) priment sur cette règle
      beforeFiles: [],
      afterFiles: [
        {
          source: "/api/:path*",
          destination: "http://127.0.0.1:5000/api/:path*",
        },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
