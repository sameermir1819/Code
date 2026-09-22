/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    serverComponentsExternalPackages: ["@prisma/client"],
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "clsx",
      "tailwind-merge",
      "zod",
    ],
  },
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
