import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  // Allow access from other devices on the local network (mobile testing, etc.)
  allowedDevOrigins: [
    '192.168.1.*',
    '192.168.0.*',
    '10.0.0.*',
    '172.16.*.*',
  ],
};

export default nextConfig;
