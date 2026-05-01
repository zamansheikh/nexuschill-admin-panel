/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for the Docker image — bundles a minimal node_modules
  // tree at .next/standalone so the runtime stage stays small.
  output: 'standalone',
};

export default nextConfig;
