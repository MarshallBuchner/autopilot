/**
 * Reset Live Sandbox to the seeded dataset.
 * Run: npm run sandbox:reset
 */
import path from "path";
import { closeSandboxDb } from "../src/lib/sandbox/db";
import { resetSandbox } from "../src/lib/sandbox/service";

process.env.SANDBOX_DATA_DIR =
  process.env.SANDBOX_DATA_DIR ?? path.join(process.cwd(), "data");

const status = resetSandbox();
console.log(JSON.stringify(status, null, 2));
closeSandboxDb();
