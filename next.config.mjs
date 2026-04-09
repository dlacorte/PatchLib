/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow build to continue with type errors
    ignoreBuildErrors: false,
  },
  // Don't validate the Prisma schema during build
  experimental: {
    // Skip data collection for dynamic routes
  },
};

export default nextConfig;
