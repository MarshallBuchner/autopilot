import { getSandboxStatus } from "@/lib/sandbox/service";
import { jsonOk } from "@/lib/sandbox/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk(getSandboxStatus());
}
