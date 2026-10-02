import { ensureSandboxAvailable, jsonError, jsonOk } from "@/lib/sandbox/api";
import { createSandboxLike } from "@/lib/sandbox/service";
import { SANDBOX_CURRENT_USER_ID } from "@/lib/sandbox/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = ensureSandboxAvailable();
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  if (!body || typeof body !== "object") {
    return jsonError("Expected JSON object");
  }

  const { toUserId, fromUserId } = body as {
    toUserId?: unknown;
    fromUserId?: unknown;
  };

  if (typeof toUserId !== "string" || !toUserId.trim()) {
    return jsonError("toUserId is required");
  }

  const from =
    typeof fromUserId === "string" && fromUserId.trim()
      ? fromUserId.trim()
      : SANDBOX_CURRENT_USER_ID;

  try {
    const result = createSandboxLike(from, toUserId.trim());
    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to create like",
      400
    );
  }
}
