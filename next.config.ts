import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sandpack 2.20.0 client registration is not stable under development
  // Strict Mode's effect replay; Gate 0 validates that provisional dependency.
  reactStrictMode: false,
};

export default nextConfig;
