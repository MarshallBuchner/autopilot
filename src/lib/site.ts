/** Public release links — override via env when deploying. */
export const SITE = {
  name: "AUTOPILOT",
  tagline: "Let it swipe. You do you.",
  version: "v0.3",
  githubUrl:
    process.env.NEXT_PUBLIC_GITHUB_URL ??
    "https://github.com/MarshallBuchner/autopilot",
  deployUrl: process.env.NEXT_PUBLIC_DEPLOY_URL ?? "",
} as const;
