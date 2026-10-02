import { ensureSandboxAvailable, jsonError, jsonOk } from "@/lib/sandbox/api";
import { listSandboxMatches } from "@/lib/sandbox/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = ensureSandboxAvailable();
  if (blocked) return blocked;
  try {
    return jsonOk({ matches: listSandboxMatches() });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to list matches",
      500
    );
  }
}
