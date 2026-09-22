/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
      "recharts",
      "date-fns",
      "clsx",
      "tailwind-merge",
    ],
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
