import { ensureSandboxAvailable, jsonError, jsonOk } from "@/lib/sandbox/api";
import { getNextSandboxProfile } from "@/lib/sandbox/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = ensureSandboxAvailable();
  if (blocked) return blocked;
  try {
    const profile = getNextSandboxProfile();
    return jsonOk({ profile });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to fetch next profile",
      500
    );
  }
}
