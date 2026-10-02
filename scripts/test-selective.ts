/**
 * SelectiveDecisionEngine + AI Selective sandbox decision tests.
 * Run: npx tsx --test scripts/test-selective.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { listCuratedProfiles } from "../src/lib/automation/demoProfiles";
import { evaluateProfile, SCORE_WEIGHTS } from "../src/lib/selective/SelectiveDecisionEngine";
import {
  DEFAULT_DATING_PREFERENCES,
  normalizeDatingPreferences,
  type DatingPreferences,
} from "../src/lib/selective/types";
import { closeSandboxDb } from "../src/lib/sandbox/db";
import {
  getNextSandboxProfile,
  getSandboxStatus,
  initializeSandbox,
  listSandboxMatches,
  recordSandboxDecision,
  resetSandbox,
} from "../src/lib/sandbox/service";
const weightSum =
  SCORE_WEIGHTS.age +
  SCORE_WEIGHTS.distance +
  SCORE_WEIGHTS.relationshipGoal +
  SCORE_WEIGHTS.interests +
  SCORE_WEIGHTS.lifestyle;

assert.equal(weightSum, 100);

function graceProfile() {
  const grace = listCuratedProfiles().find((p) => p.firstName === "Grace");
  assert.ok(grace);
  return grace!;
}

function prefs(partial?: Partial<DatingPreferences>): DatingPreferences {
  return normalizeDatingPreferences({
    ...DEFAULT_DATING_PREFERENCES,
    ...partial,
  });
}

describe("SelectiveDecisionEngine", () => {
  it("1. same profile + preferences always returns same result", () => {
    const p = graceProfile();
    const preferences = prefs({
      minAge: 24,
      maxAge: 30,
      maxDistanceKm: 40,
      preferredRelationshipGoals: ["long-term", "open-to-see"],
      preferredInterests: ["Hockey", "Outdoors", "Hiking", "Coffee"],
      likeThreshold: 70,
    });
    const a = evaluateProfile(p, preferences);
    const b = evaluateProfile(p, preferences);
    assert.deepEqual(a, b);
  });

  it("2. score remains 0–100", () => {
    const p = graceProfile();
    const result = evaluateProfile(p, prefs());
    assert.ok(result.score >= 0 && result.score <= 100);
  });

  it("3. required age failure → PASS", () => {
    const p = graceProfile();
    const result = evaluateProfile(
      p,
      prefs({ minAge: 30, maxAge: 35, likeThreshold: 50 })
    );
    assert.equal(result.decision, "PASS");
    assert.ok(result.hardFilterFailures.some((r) => /age/i.test(r)));
  });

  it("4. required distance failure → PASS", () => {
    const p = graceProfile();
    const result = evaluateProfile(
      p,
      prefs({ maxDistanceKm: 2, likeThreshold: 50 })
    );
    assert.equal(result.decision, "PASS");
    assert.ok(result.hardFilterFailures.some((r) => /distance/i.test(r)));
  });

  it("5. preferred interest increases score", () => {
    const p = graceProfile();
    const without = evaluateProfile(
      p,
      prefs({ preferredInterests: ["Gaming", "Wine"], likeThreshold: 99 })
    );
    const withHockey = evaluateProfile(
      p,
      prefs({ preferredInterests: ["Hockey", "Outdoors"], likeThreshold: 99 })
    );
    assert.ok(withHockey.score > without.score);
  });

  it("6. relationship-goal alignment affects score", () => {
    const p = graceProfile(); // long-term
    const aligned = evaluateProfile(
      p,
      prefs({ preferredRelationshipGoals: ["long-term"], likeThreshold: 99 })
    );
    const mismatched = evaluateProfile(
      p,
      prefs({ preferredRelationshipGoals: ["casual"], likeThreshold: 99 })
    );
    assert.ok(aligned.score > mismatched.score);
  });

  it("7. threshold controls LIKE/PASS", () => {
    const p = graceProfile();
    const preferences = prefs({
      preferredInterests: ["Hockey", "Outdoors", "Hiking", "Coffee"],
      preferredRelationshipGoals: ["long-term"],
    });
    const base = evaluateProfile(p, preferences);
    const like = evaluateProfile(p, { ...preferences, likeThreshold: Math.max(50, base.score - 5) });
    const pass = evaluateProfile(p, { ...preferences, likeThreshold: Math.min(90, base.score + 5) });
    if (base.hardFilterFailures.length === 0) {
      assert.equal(like.decision, "LIKE");
      if (base.score + 5 <= 90) assert.equal(pass.decision, "PASS");
    }
  });

  it("8. hard-filter failure overrides threshold", () => {
    const p = graceProfile();
    const result = evaluateProfile(
      p,
      prefs({
        minAge: 40,
        maxAge: 50,
        likeThreshold: 10,
        preferredInterests: ["Hockey", "Outdoors"],
      })
    );
    assert.equal(result.decision, "PASS");
    assert.ok(result.hardFilterFailures.length > 0);
  });

  it("Grace strongly aligned → LIKE (success path)", () => {
    const p = graceProfile();
    const result = evaluateProfile(
      p,
      prefs({
        minAge: 24,
        maxAge: 30,
        maxDistanceKm: 25,
        preferredRelationshipGoals: ["long-term", "open-to-see"],
        preferredInterests: ["Hockey", "Outdoors", "Hiking"],
        smokingPreference: "non_smoker_preferred",
        activityPreference: "active_preferred",
        likeThreshold: 70,
      })
    );
    assert.equal(result.decision, "LIKE");
    assert.ok(result.score >= 70);
  });
});

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "autopilot-selective-"));
process.env.SANDBOX_DATA_DIR = tmpDir;
delete process.env.VERCEL;
delete process.env.SANDBOX_FORCE_DISABLE;

before(() => {
  closeSandboxDb();
  initializeSandbox();
});

after(() => {
  closeSandboxDb();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("AI Selective sandbox persistence", () => {
  it("9–10. LIKE and PASS persist decisions", () => {
    resetSandbox();
    const next = getNextSandboxProfile();
    assert.ok(next);
    const like = recordSandboxDecision({
      toUserId: next!.id,
      decision: "LIKE",
      strategy: "AI_SELECTIVE",
      score: 88,
      reasons: ["test"],
    });
    assert.equal(like.decision.decision, "LIKE");
    assert.equal(like.decision.created, true);
    assert.ok(like.like);

    const status = getSandboxStatus();
    assert.ok(status.outgoingLikes >= 1);
    assert.ok(status.decisions >= 1);

    const next2 = getNextSandboxProfile();
    assert.ok(next2);
    const pass = recordSandboxDecision({
      toUserId: next2!.id,
      decision: "PASS",
      strategy: "AI_SELECTIVE",
      score: 40,
    });
    assert.equal(pass.decision.decision, "PASS");
    assert.equal(pass.match, null);
    assert.ok(getSandboxStatus().passes >= 1);
  });

  it("11. passed profile excluded from next", () => {
    resetSandbox();
    const first = getNextSandboxProfile();
    assert.ok(first);
    recordSandboxDecision({
      toUserId: first!.id,
      decision: "PASS",
      strategy: "AI_SELECTIVE",
      score: 22,
    });
    const second = getNextSandboxProfile();
    assert.ok(second);
    assert.notEqual(second!.id, first!.id);
  });

  it("12. liked profile remains excluded", () => {
    resetSandbox();
    const first = getNextSandboxProfile();
    assert.ok(first);
    recordSandboxDecision({
      toUserId: first!.id,
      decision: "LIKE",
      strategy: "AI_SELECTIVE",
      score: 90,
    });
    const second = getNextSandboxProfile();
    assert.ok(second);
    assert.notEqual(second!.id, first!.id);
  });

  it("13. AI Selective Like can produce reciprocal Match", () => {
    resetSandbox();
    // Walk until Grace (or another reciprocal liker)
    let profile = getNextSandboxProfile();
    let matched = false;
    const seen = new Set<string>();
    while (profile && !seen.has(profile.id)) {
      seen.add(profile.id);
      const result = recordSandboxDecision({
        toUserId: profile.id,
        decision: "LIKE",
        strategy: "AI_SELECTIVE",
        score: 85,
      });
      if (result.match) {
        matched = true;
        break;
      }
      profile = getNextSandboxProfile();
    }
    assert.ok(matched);
    assert.ok(listSandboxMatches().length >= 1);
  });

  it("14. AI Selective Pass cannot create Match", () => {
    resetSandbox();
    const before = listSandboxMatches().length;
    const profile = getNextSandboxProfile();
    assert.ok(profile);
    const result = recordSandboxDecision({
      toUserId: profile!.id,
      decision: "PASS",
      strategy: "AI_SELECTIVE",
      score: 10,
    });
    assert.equal(result.match, null);
    assert.equal(listSandboxMatches().length, before);
  });

  it("15. duplicate decisions are idempotent", () => {
    resetSandbox();
    const profile = getNextSandboxProfile();
    assert.ok(profile);
    const a = recordSandboxDecision({
      toUserId: profile!.id,
      decision: "PASS",
      strategy: "AI_SELECTIVE",
      score: 33,
    });
    const b = recordSandboxDecision({
      toUserId: profile!.id,
      decision: "PASS",
      strategy: "AI_SELECTIVE",
      score: 33,
    });
    assert.equal(a.decision.created, true);
    assert.equal(b.decision.created, false);
    assert.equal(a.decision.id, b.decision.id);
    assert.equal(getSandboxStatus().passes, 1);
  });

  it("16. reset clears decisions and restores sandbox", () => {
    const restored = resetSandbox();
    assert.equal(restored.outgoingLikes, 0);
    assert.equal(restored.passes, 0);
    assert.equal(restored.decisions, 0);
    assert.equal(restored.matches, 0);
    assert.ok(restored.incomingLikes >= 1);
    assert.ok(restored.profiles >= 30);
  });
});

describe("Demo AI Selective adapter smoke", () => {
  it("19. Demo AI Selective works", async () => {
    const { DemoAutomationAdapter } = await import(
      "../src/lib/automation/DemoAutomationAdapter"
    );
    const adapter = new DemoAutomationAdapter();
    let likes = 0;
    let passes = 0;
    let evaluated = 0;
    let done: string | null = null;
    adapter.on("profileEvaluated", () => {
      evaluated += 1;
    });
    adapter.on("actionPerformed", ({ action }) => {
      if (action === "like") likes += 1;
      else passes += 1;
    });
    adapter.on("sessionComplete", ({ reason }) => {
      done = reason;
    });
    await adapter.connect();
    await adapter.start({
      mode: "ai_selective",
      maxProfiles: 4,
      actionDelaySeconds: 1,
      randomizeTiming: false,
      stopAfterMax: true,
      preferences: prefs({
        preferredInterests: ["Hockey", "Coffee", "Hiking", "Travel"],
        likeThreshold: 70,
      }),
    });
    const deadline = Date.now() + 25_000;
    while (done === null && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 50));
    }
    assert.equal(done, "max_profiles");
    assert.equal(evaluated, 4);
    assert.equal(likes + passes, 4);
    await adapter.disconnect();
  });
});
