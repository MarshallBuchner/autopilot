import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node module used by Live Sandbox APIs only.
  serverExternalPackages: ["better-sqlite3"],
  // Allow Playwright / local tooling hitting 127.0.0.1 while the app serves on localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
