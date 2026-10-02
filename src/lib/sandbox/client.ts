import type { DemoProfile, MatchRecord } from "@/lib/types";
import type {
  SandboxDecisionResult,
  SandboxInspectData,
  SandboxLikeResult,
  SandboxStatus,
} from "@/lib/sandbox/types";
import type { SelectiveDecision, StrategyKind } from "@/lib/selective/types";

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Sandbox request failed (${response.status})`
    );
  }
  return data;
}

export async function fetchSandboxStatus(): Promise<SandboxStatus> {
  const res = await fetch("/api/sandbox/status", { cache: "no-store" });
  return parseJson<SandboxStatus>(res);
}

export async function initializeSandboxRemote(): Promise<SandboxStatus> {
  const res = await fetch("/api/sandbox/initialize", { method: "POST" });
  return parseJson<SandboxStatus>(res);
}

export async function resetSandboxRemote(): Promise<SandboxStatus> {
  const res = await fetch("/api/sandbox/reset", { method: "POST" });
  return parseJson<SandboxStatus>(res);
}

export async function fetchNextSandboxProfile(): Promise<DemoProfile | null> {
  const res = await fetch("/api/sandbox/profiles/next", { cache: "no-store" });
  const data = await parseJson<{ profile: DemoProfile | null }>(res);
  return data.profile;
}

export async function postSandboxLike(toUserId: string): Promise<SandboxLikeResult> {
  const res = await fetch("/api/sandbox/likes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ toUserId }),
  });
  return parseJson<SandboxLikeResult>(res);
}

export async function postSandboxDecision(input: {
  toUserId: string;
  decision: SelectiveDecision;
  strategy: StrategyKind;
  score?: number | null;
  reasons?: unknown;
}): Promise<SandboxDecisionResult> {
  const res = await fetch("/api/sandbox/decisions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseJson<SandboxDecisionResult>(res);
}

export async function fetchSandboxMatches(): Promise<MatchRecord[]> {
  const res = await fetch("/api/sandbox/matches", { cache: "no-store" });
  const data = await parseJson<{ matches: MatchRecord[] }>(res);
  return data.matches;
}

export async function fetchSandboxInspect(): Promise<SandboxInspectData> {
  const res = await fetch("/api/sandbox/inspect", { cache: "no-store" });
  return parseJson<SandboxInspectData>(res);
}
