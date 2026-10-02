/**
 * Initialize / re-seed the local Live Sandbox database.
 * Run: npm run sandbox:init
 */
import path from "path";
import { closeSandboxDb } from "../src/lib/sandbox/db";
import { initializeSandbox } from "../src/lib/sandbox/service";

process.env.SANDBOX_DATA_DIR =
  process.env.SANDBOX_DATA_DIR ?? path.join(process.cwd(), "data");

const status = initializeSandbox();
console.log(JSON.stringify(status, null, 2));
closeSandboxDb();
