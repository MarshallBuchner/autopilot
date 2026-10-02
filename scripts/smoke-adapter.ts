/**
 * Lightweight functional smoke test for DemoAutomationAdapter.
 * Run: npx tsx scripts/smoke-adapter.ts
 */
import { DemoAutomationAdapter } from "../src/lib/automation/DemoAutomationAdapter";
import { DEFAULT_DATING_PREFERENCES } from "../src/lib/selective/types";

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const adapter = new DemoAutomationAdapter();
  let profiles = 0;
  let likes = 0;
  let matches = 0;
  let completedReason: string | null = null;

  adapter.on("profileLoaded", () => {
    profiles += 1;
  });
  adapter.on("actionPerformed", () => {
    likes += 1;
  });
  adapter.on("matchDetected", () => {
    matches += 1;
  });
  adapter.on("sessionComplete", ({ reason }) => {
    completedReason = reason;
  });

  await adapter.connect();
  console.assert(adapter.getStatus() === "connected", "should be connected");

  await adapter.start({
    mode: "like_everyone",
    maxProfiles: 5,
    actionDelaySeconds: 1,
    randomizeTiming: false,
    stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
  });

  // Wait enough for 5 profiles (load + like cycles)
  const deadline = Date.now() + 20_000;
  while (completedReason === null && Date.now() < deadline) {
    await sleep(200);
  }

  console.log({
    status: adapter.getStatus(),
    profiles,
    likes,
    matches,
    completedReason,
  });

  console.assert(completedReason === "max_profiles", "should stop at max");
  console.assert(likes === 5, `expected 5 likes, got ${likes}`);
  console.assert(profiles === 5, `expected 5 profiles, got ${profiles}`);
  console.assert(adapter.getStatus() === "stopped", "should be stopped");

  // Start/stop mid-run
  completedReason = null;
  await adapter.start({
    mode: "like_everyone",
    maxProfiles: 50,
    actionDelaySeconds: 1,
    randomizeTiming: true,
    stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
  });
  await sleep(1500);
  await adapter.stop();
  await sleep(300);
  console.assert(adapter.getStatus() === "stopped", "manual stop works");
  console.assert(completedReason === "stopped", "sessionComplete stopped");

  console.log("SMOKE OK");
  await adapter.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
