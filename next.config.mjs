/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // SST Ion 3.x places platform source in .sst/platform/src/ which the
    // Next.js build worker picks up despite tsconfig exclude. Our own types
    // are verified separately via `tsc --noEmit` in CI.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
