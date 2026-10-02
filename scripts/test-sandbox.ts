/**
 * Integration tests for Live Sandbox persistence + reciprocal matching.
 * Run: npx tsx --test scripts/test-sandbox.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { closeSandboxDb } from "../src/lib/sandbox/db";
import {
  buildSandboxSeedProfiles,
  RECIPROCAL_LIKER_NAMES,
  SANDBOX_CURRENT_USER,
} from "../src/lib/sandbox/seed";
import {
  createSandboxLike,
  getNextSandboxProfile,
  getSandboxStatus,
  initializeSandbox,
  listSandboxMatches,
  resetSandbox,
} from "../src/lib/sandbox/service";
import { SANDBOX_CURRENT_USER_ID } from "../src/lib/sandbox/types";

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "autopilot-sandbox-"));
process.env.SANDBOX_DATA_DIR = tmpDir;
delete process.env.VERCEL;
delete process.env.SANDBOX_FORCE_DISABLE;

before(() => {
  closeSandboxDb();
});

after(() => {
  closeSandboxDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("Live Sandbox backend", () => {
  it("1. seed creates profiles", () => {
    const status = initializeSandbox();
    assert.equal(status.available, true);
    assert.equal(status.initialized, true);
    assert.ok(status.profiles >= 30 && status.profiles <= 55);
  });

  it("2. current user exists (Alex)", () => {
    const status = getSandboxStatus();
    assert.equal(status.currentUserId, SANDBOX_CURRENT_USER_ID);
    assert.equal(SANDBOX_CURRENT_USER.firstName, "Alex");
    assert.equal(SANDBOX_CURRENT_USER.age, 29);
  });

  it("3. like persists", () => {
    const next = getNextSandboxProfile();
    assert.ok(next, "expected an eligible profile");
    const result = createSandboxLike(SANDBOX_CURRENT_USER_ID, next!.id);
    assert.equal(result.like.created, true);
    assert.equal(result.like.fromUserId, SANDBOX_CURRENT_USER_ID);
    assert.equal(result.like.toUserId, next!.id);

    const status = getSandboxStatus();
    assert.ok(status.outgoingLikes >= 1);
  });

  it("4. duplicate like is idempotent", () => {
    const nextBefore = getNextSandboxProfile();
    // Re-like the first outgoing target by using inspect path: like someone again
    resetSandbox();
    const profile = getNextSandboxProfile();
    assert.ok(profile);
    const first = createSandboxLike(SANDBOX_CURRENT_USER_ID, profile!.id);
    const second = createSandboxLike(SANDBOX_CURRENT_USER_ID, profile!.id);
    assert.equal(first.like.created, true);
    assert.equal(second.like.created, false);
    assert.equal(first.like.id, second.like.id);
    assert.equal(getSandboxStatus().outgoingLikes, 1);
    // next profile should advance past liked user
    const after = getNextSandboxProfile();
    assert.notEqual(after?.id, profile!.id);
    void nextBefore;
  });

  it("5. one-way like does NOT create match", () => {
    resetSandbox();
    const skip = new Set(RECIPROCAL_LIKER_NAMES as readonly string[]);
    const oneWay = buildSandboxSeedProfiles().find(
      (p) => p.id !== SANDBOX_CURRENT_USER_ID && !skip.has(p.firstName)
    );
    assert.ok(oneWay, "need a non-reciprocal seeded profile");
    const result = createSandboxLike(SANDBOX_CURRENT_USER_ID, oneWay!.id);
    assert.equal(result.match, null);
    assert.equal(listSandboxMatches().length, 0);
  });

  it("6. reciprocal like DOES create match", () => {
    resetSandbox();
    // Walk until we hit a seeded reciprocal liker (e.g. Grace)
    let profile = getNextSandboxProfile();
    let matchResult = null as ReturnType<typeof createSandboxLike> | null;
    const seen = new Set<string>();
    while (profile && !seen.has(profile.id)) {
      seen.add(profile.id);
      const result = createSandboxLike(SANDBOX_CURRENT_USER_ID, profile.id);
      if (result.match) {
        matchResult = result;
        break;
      }
      profile = getNextSandboxProfile();
    }
    assert.ok(matchResult?.match, "expected a reciprocal match");
    assert.equal(matchResult!.match!.created, true);
    assert.ok(
      (RECIPROCAL_LIKER_NAMES as readonly string[]).includes(
        matchResult!.match!.profile.firstName
      )
    );
    assert.equal(listSandboxMatches().length, 1);
  });

  it("7. duplicate reciprocal action does NOT duplicate match", () => {
    const matchesBefore = listSandboxMatches();
    assert.ok(matchesBefore.length >= 1);
    const targetId = matchesBefore[0]!.profile.id;
    const again = createSandboxLike(SANDBOX_CURRENT_USER_ID, targetId);
    assert.ok(again.match);
    assert.equal(again.match!.created, false);
    assert.equal(again.like.created, false);
    assert.equal(listSandboxMatches().length, matchesBefore.length);
  });

  it("8. next-profile excludes already-liked users", () => {
    resetSandbox();
    const first = getNextSandboxProfile();
    assert.ok(first);
    createSandboxLike(SANDBOX_CURRENT_USER_ID, first!.id);
    const second = getNextSandboxProfile();
    assert.ok(second);
    assert.notEqual(second!.id, first!.id);
  });

  it("9. reset restores initial state", () => {
    // Create some activity first
    const p = getNextSandboxProfile();
    if (p) createSandboxLike(SANDBOX_CURRENT_USER_ID, p.id);
    const afterActivity = getSandboxStatus();
    assert.ok(afterActivity.outgoingLikes >= 1);

    const restored = resetSandbox();
    assert.equal(restored.outgoingLikes, 0);
    assert.equal(restored.matches, 0);
    assert.ok(restored.incomingLikes >= RECIPROCAL_LIKER_NAMES.length);
    assert.ok(restored.profiles >= 30);
  });
});
