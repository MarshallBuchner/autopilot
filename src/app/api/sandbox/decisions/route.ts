import { ensureSandboxAvailable, jsonError, jsonOk } from "@/lib/sandbox/api";
import { recordSandboxDecision } from "@/lib/sandbox/service";
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

  const { toUserId, fromUserId, decision, strategy, score, reasons } = body as {
    toUserId?: unknown;
    fromUserId?: unknown;
    decision?: unknown;
    strategy?: unknown;
    score?: unknown;
    reasons?: unknown;
  };

  if (typeof toUserId !== "string" || !toUserId.trim()) {
    return jsonError("toUserId is required");
  }
  if (decision !== "LIKE" && decision !== "PASS") {
    return jsonError("decision must be LIKE or PASS");
  }
  if (strategy !== "LIKE_EVERYONE" && strategy !== "AI_SELECTIVE") {
    return jsonError("strategy must be LIKE_EVERYONE or AI_SELECTIVE");
  }

  const from =
    typeof fromUserId === "string" && fromUserId.trim()
      ? fromUserId.trim()
      : SANDBOX_CURRENT_USER_ID;

  try {
    const result = recordSandboxDecision({
      fromUserId: from,
      toUserId: toUserId.trim(),
      decision,
      strategy,
      score: typeof score === "number" ? score : score === null ? null : undefined,
      reasons,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Failed to record decision",
      400
    );
  }
}
