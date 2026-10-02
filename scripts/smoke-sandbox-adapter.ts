import { DEFAULT_DATING_PREFERENCES } from "../src/lib/selective/types";
/**
 * Smoke tests for SandboxAutomationAdapter against the real SQLite service
 * via a local fetch mock (no Next.js server required).
 *
 * Run: npx tsx --test scripts/smoke-sandbox-adapter.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { SandboxAutomationAdapter } from "../src/lib/automation/SandboxAutomationAdapter";
import { closeSandboxDb } from "../src/lib/sandbox/db";
import {
  createSandboxLike,
  getNextSandboxProfile,
  getSandboxStatus,
  initializeSandbox,
  listSandboxMatches,
  recordSandboxDecision,
  resetSandbox,
} from "../src/lib/sandbox/service";
import { SANDBOX_CURRENT_USER_ID } from "../src/lib/sandbox/types";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "autopilot-sandbox-adapter-"));
process.env.SANDBOX_DATA_DIR = tmpDir;
delete process.env.VERCEL;
delete process.env.SANDBOX_FORCE_DISABLE;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

before(() => {
  closeSandboxDb();
  initializeSandbox();

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.endsWith("/api/sandbox/status") && method === "GET") {
      return jsonResponse(getSandboxStatus());
    }
    if (url.endsWith("/api/sandbox/profiles/next") && method === "GET") {
      return jsonResponse({ profile: getNextSandboxProfile() });
    }
    if (url.endsWith("/api/sandbox/likes") && method === "POST") {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      try {
        const result = createSandboxLike(
          body.fromUserId ?? SANDBOX_CURRENT_USER_ID,
          body.toUserId
        );
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse(
          { error: error instanceof Error ? error.message : "like failed" },
          400
        );
      }
    }
    if (url.endsWith("/api/sandbox/decisions") && method === "POST") {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      try {
        const result = recordSandboxDecision({
          fromUserId: body.fromUserId ?? SANDBOX_CURRENT_USER_ID,
          toUserId: body.toUserId,
          decision: body.decision,
          strategy: body.strategy,
          score: body.score,
          reasons: body.reasons,
        });
        return jsonResponse(result);
      } catch (error) {
        return jsonResponse(
          { error: error instanceof Error ? error.message : "decision failed" },
          400
        );
      }
    }
    if (url.endsWith("/api/sandbox/matches") && method === "GET") {
      return jsonResponse({ matches: listSandboxMatches() });
    }
    if (url.endsWith("/api/sandbox/initialize") && method === "POST") {
      return jsonResponse(initializeSandbox());
    }
    if (url.endsWith("/api/sandbox/reset") && method === "POST") {
      return jsonResponse(resetSandbox());
    }
    return jsonResponse({ error: `Unhandled ${method} ${url}` }, 404);
  }) as typeof fetch;
});

after(() => {
  closeSandboxDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("SandboxAutomationAdapter", () => {
  it("10. receives real backend profile", async () => {
    resetSandbox();
    const adapter = new SandboxAutomationAdapter();
    let loaded: { firstName: string; id: string } | null = null;
    adapter.on("profileLoaded", (p) => {
      loaded = { firstName: p.firstName, id: p.id };
    });
    await adapter.connect();
    assert.equal(adapter.getStatus(), "connected");

    await adapter.start({
      mode: "like_everyone",
      maxProfiles: 1,
      actionDelaySeconds: 1,
      randomizeTiming: false,
      stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
    });

    const deadline = Date.now() + 8_000;
    while (!loaded && Date.now() < deadline) await sleep(50);
    assert.ok(loaded, "expected profileLoaded from backend");
    assert.ok(loaded!.id.startsWith("user-"));
    await adapter.stop();
    await adapter.disconnect();
  });

  it("11. like causes backend write", async () => {
    resetSandbox();
    const before = getSandboxStatus().outgoingLikes;
    const adapter = new SandboxAutomationAdapter();
    let liked = false;
    adapter.on("actionPerformed", () => {
      liked = true;
    });
    await adapter.connect();
    await adapter.start({
      mode: "like_everyone",
      maxProfiles: 1,
      actionDelaySeconds: 1,
      randomizeTiming: false,
      stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
    });

    const deadline = Date.now() + 10_000;
    while (!liked && Date.now() < deadline) await sleep(50);
    assert.ok(liked, "expected actionPerformed after backend like");
    assert.equal(getSandboxStatus().outgoingLikes, before + 1);
    await adapter.disconnect();
  });

  it("12. receives backend-confirmed match", async () => {
    resetSandbox();
    const adapter = new SandboxAutomationAdapter();
    let matchName: string | null = null;
    let completed: string | null = null;
    adapter.on("matchDetected", (p) => {
      matchName = p.firstName;
    });
    adapter.on("sessionComplete", ({ reason }) => {
      completed = reason;
    });

    await adapter.connect();
    await adapter.start({
      mode: "like_everyone",
      maxProfiles: 15,
      actionDelaySeconds: 1,
      randomizeTiming: false,
      stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
    });

    const deadline = Date.now() + 45_000;
    while (!matchName && completed === null && Date.now() < deadline) {
      await sleep(100);
    }
    assert.ok(matchName, "expected backend-confirmed match from reciprocal liker");
    assert.ok(listSandboxMatches().some((m) => m.profile.firstName === matchName));
    await adapter.stop();
    await adapter.disconnect();
  });

  it("13. start/stop still works", async () => {
    resetSandbox();
    const adapter = new SandboxAutomationAdapter();
    let reason: string | null = null;
    adapter.on("sessionComplete", ({ reason: r }) => {
      reason = r;
    });
    await adapter.connect();
    await adapter.start({
      mode: "like_everyone",
      maxProfiles: 50,
      actionDelaySeconds: 1,
      randomizeTiming: false,
      stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
    });
    await sleep(800);
    await adapter.stop();
    await sleep(200);
    assert.equal(adapter.getStatus(), "stopped");
    assert.equal(reason, "stopped");
    await adapter.disconnect();
  });

  it("14. max-profile stopping still works", async () => {
    resetSandbox();
    const adapter = new SandboxAutomationAdapter();
    let likes = 0;
    let reason: string | null = null;
    adapter.on("actionPerformed", () => {
      likes += 1;
    });
    adapter.on("sessionComplete", ({ reason: r }) => {
      reason = r;
    });
    await adapter.connect();
    await adapter.start({
      mode: "like_everyone",
      maxProfiles: 3,
      actionDelaySeconds: 1,
      randomizeTiming: false,
      stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
    });

    const deadline = Date.now() + 25_000;
    while (reason === null && Date.now() < deadline) await sleep(100);
    assert.equal(reason, "max_profiles");
    assert.equal(likes, 3);
    assert.equal(adapter.getStatus(), "stopped");
    await adapter.disconnect();
  });
});
