import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native Node module used by Live Sandbox APIs only.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
