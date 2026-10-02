import { ensureSandboxAvailable, jsonError, jsonOk } from "@/lib/sandbox/api";
import { resetSandbox } from "@/lib/sandbox/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const blocked = ensureSandboxAvailable();
  if (blocked) return blocked;
  try {
    return jsonOk(resetSandbox());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to reset sandbox",
      500
    );
  }
}
