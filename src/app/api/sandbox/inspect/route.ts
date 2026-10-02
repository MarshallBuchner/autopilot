import { ensureSandboxAvailable, jsonError, jsonOk } from "@/lib/sandbox/api";
import { inspectSandbox } from "@/lib/sandbox/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = ensureSandboxAvailable();
  if (blocked) return blocked;
  try {
    return jsonOk(inspectSandbox());
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to inspect sandbox",
      500
    );
  }
}
