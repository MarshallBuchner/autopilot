import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = "http://127.0.0.1:3000";
const outDir = path.join(process.cwd(), "scripts", "ui-artifacts");
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const results = [];

  const check = (name, ok, note) => {
    results.push({ name, ok, note });
    console.log(`${ok ? "PASS" : "FAIL"} — ${name}${note ? ` (${note})` : ""}`);
  };

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // Wait for client adapter hydration
  await page.waitForFunction(
    () => document.body.innerText.includes("Demo engine connected"),
    null,
    { timeout: 10_000 }
  );

  const body = await page.textContent("body");
  check("Brand AUTOPILOT", !!body?.includes("AUTOPILOT"));
  check("Subtitle", !!body?.includes("Let it swipe. You do you."));
  check("Local Experiment badge", !!body?.toLowerCase().includes("local experiment"));
  check("Sidebar Dashboard", !!body?.includes("Dashboard"));
  check("Sidebar Sessions", !!body?.includes("Sessions"));
  check("Demo engine connected", !!body?.includes("Demo engine connected"));

  await page.screenshot({ path: path.join(outDir, "dashboard-idle.png"), fullPage: true });

  const slider = page.locator('input[type="range"].ap-slider').first();
  await slider.fill("1");
  await page.getByRole("button", { name: "25", exact: true }).click();

  await page.getByRole("button", { name: /START AUTOPILOT/i }).click();
  await page.waitForTimeout(800);
  check("Running status", !!(await page.textContent("body"))?.includes("Running"));

  await page.waitForFunction(() => document.body.innerText.includes("Liked"), null, {
    timeout: 15_000,
  });
  const runningBody = await page.textContent("body");
  check("Profile liked activity", !!runningBody?.includes("Liked"));
  check("Profile loaded activity", !!runningBody?.includes("Profile loaded"));

  await page.screenshot({
    path: path.join(outDir, "dashboard-running.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /STOP AUTOPILOT/i }).click();
  await page.waitForTimeout(600);
  const stoppedBody = await page.textContent("body");
  check("Stopped status", !!stoppedBody?.includes("Stopped"));
  check(
    "Session stop activity",
    !!stoppedBody?.includes("AUTOPILOT stopped") ||
      !!stoppedBody?.includes("Session complete")
  );

  const likesBefore = await page.evaluate(() => {
    const raw = localStorage.getItem("autopilot.v01.state");
    return raw ? JSON.parse(raw) : null;
  });
  check("localStorage written", !!likesBefore);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const afterReload = await page.evaluate(() =>
    localStorage.getItem("autopilot.v01.state")
  );
  check("localStorage persists after refresh", !!afterReload);

  for (const route of ["/sessions", "/matches", "/settings", "/about"]) {
    const res = await page.goto(BASE + route, { waitUntil: "networkidle" });
    check(`Route ${route}`, res?.ok() === true, `status ${res?.status()}`);
  }

  const about = await page.textContent("body");
  check("About disclaimer Tinder", !!about?.includes("Tinder"));
  check("About simulation mode", !!about?.includes("simulation"));
  await page.screenshot({ path: path.join(outDir, "about.png"), fullPage: true });

  await page.goto(BASE + "/settings", { waitUntil: "networkidle" });
  const settings = await page.textContent("body");
  check(
    "Settings privacy copy",
    !!settings?.includes("stores demo/session data locally")
  );

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Reset Demo/i }).click();
  await page.waitForTimeout(400);
  const resetBody = await page.textContent("body");
  check("Reset shows Start button", !!resetBody?.includes("START AUTOPILOT"));
  check("Reset clears activity feed empty state", !!resetBody?.includes("No activity yet"));

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 5000 }).catch(() => null),
    page.getByRole("button", { name: /Export JSON/i }).click(),
  ]);
  check(
    "Export JSON triggers download",
    download !== null,
    download?.suggestedFilename()
  );

  const failed = results.filter((r) => !r.ok);
  console.log("\n---");
  console.log(`Passed ${results.length - failed.length}/${results.length}`);
  if (failed.length) {
    console.error("Failures:", failed);
    process.exit(1);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
