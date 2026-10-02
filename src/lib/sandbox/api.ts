import { NextResponse } from "next/server";
import { getSandboxUnavailableReason, canUseSandboxFilesystem } from "@/lib/sandbox/db";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function ensureSandboxAvailable(): NextResponse | null {
  if (!canUseSandboxFilesystem()) {
    return jsonError(
      getSandboxUnavailableReason() ?? "LOCAL SETUP REQUIRED",
      503
    );
  }
  return null;
}
