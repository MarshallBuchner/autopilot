import { DemoAutomationAdapter } from "../src/lib/automation/DemoAutomationAdapter";
import { DEFAULT_DATING_PREFERENCES } from "../src/lib/selective/types";

async function main() {
  const adapter = new DemoAutomationAdapter();
  let likes = 0;
  let matches = 0;
  let done = false;
  adapter.on("actionPerformed", () => {
    likes += 1;
  });
  adapter.on("matchDetected", () => {
    matches += 1;
  });
  adapter.on("sessionComplete", () => {
    done = true;
  });
  await adapter.connect();
  await adapter.start({
    mode: "like_everyone",
    maxProfiles: 40,
    actionDelaySeconds: 1,
    randomizeTiming: false,
    stopAfterMax: true,
    preferences: { ...DEFAULT_DATING_PREFERENCES },
  });
  while (!done) await new Promise((r) => setTimeout(r, 100));
  const rate = matches / likes;
  console.log({ likes, matches, rate: `${(rate * 100).toFixed(1)}%` });
  if (rate < 0.02 || rate > 0.25) {
    console.error("match rate out of expected band");
    process.exit(1);
  }
  console.log("MATCH RATE OK");
  await adapter.disconnect();
}

main();
