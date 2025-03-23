/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Completely disable ESLint during builds
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 