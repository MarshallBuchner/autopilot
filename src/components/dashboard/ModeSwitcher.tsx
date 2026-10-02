"use client";

import { useState } from "react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { cn } from "@/lib/cn";
import type { EnvironmentMode } from "@/lib/types";

export function ModeSwitcher() {
  const {
    environment,
    setEnvironment,
    isRunning,
    sandboxStatus,
    sandboxConnection,
    settings,
    initializeSandbox,
    resetSandbox,
    refreshSandbox,
  } = useAutopilot();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showSetup =
    environment === "live_sandbox" &&
    (!settings.sandboxSetupComplete ||
      !sandboxStatus?.initialized ||
      sandboxStatus.available === false);

  const onSelect = async (env: EnvironmentMode) => {
    if (isRunning || env === environment) return;
    setError(null);
    await setEnvironment(env);
    if (env === "live_sandbox") {
      await refreshSandbox();
    }
  };

  const onInitialize = async () => {
    setBusy(true);
    setError(null);
    try {
      await initializeSandbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Initialize failed");
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (
      !window.confirm(
        "Reset Live Sandbox? This clears all sandbox Likes and Matches and restores the initial test dataset."
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetSandbox();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  const connectionLabel =
    sandboxConnection === "connected" && sandboxStatus?.initialized
      ? "SANDBOX CONNECTED"
      : sandboxConnection === "connecting"
        ? "SANDBOX CONNECTING"
        : sandboxStatus && !sandboxStatus.available
          ? "LOCAL SETUP REQUIRED"
          : sandboxConnection === "error"
            ? "SANDBOX OFFLINE"
            : "SANDBOX OFFLINE";

  const connectedDot =
    sandboxConnection === "connected" && sandboxStatus?.initialized;

  return (
    <div className="ap-card p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-ap-text-dim">Mode</div>
          <div className="mt-2 inline-flex rounded-xl border border-ap-border p-1 bg-ap-bg">
            <ModeButton
              active={environment === "demo"}
              disabled={isRunning}
              onClick={() => void onSelect("demo")}
              label="DEMO"
            />
            <ModeButton
              active={environment === "live_sandbox"}
              disabled={isRunning}
              onClick={() => void onSelect("live_sandbox")}
              label="LIVE SANDBOX"
            />
          </div>
        </div>

        {environment === "live_sandbox" ? (
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium tracking-wide",
              connectedDot
                ? "border-[rgba(61,214,140,0.35)] bg-ap-success-soft text-ap-success"
                : "border-ap-border text-ap-text-muted"
            )}
            aria-live="polite"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                connectedDot ? "bg-ap-success ap-pulse-dot" : "bg-ap-text-dim"
              )}
            />
            {connectedDot ? "● " : "○ "}
            {connectionLabel}
          </div>
        ) : null}
      </div>

      {environment === "live_sandbox" ? (
        <div className="rounded-xl border border-ap-border-subtle bg-ap-bg/60 p-3 space-y-3">
          {showSetup || !sandboxStatus?.initialized ? (
            <>
              <p className="text-sm text-ap-text-muted leading-relaxed">
                Live Sandbox connects AUTOPILOT to a controlled local dating environment.
                Likes and matches are persisted instead of simulated.
              </p>
              {!sandboxStatus?.available ? (
                <p className="text-xs text-ap-accent leading-relaxed">
                  {sandboxStatus?.reason ??
                    "LOCAL SETUP REQUIRED — run AUTOPILOT locally with a writable data directory. Demo Mode remains fully available on this deployment."}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || !sandboxStatus.available}
                    onClick={() => void onInitialize()}
                    className="rounded-xl bg-ap-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {busy ? "Working…" : "INITIALIZE SANDBOX"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || !sandboxStatus.available}
                    onClick={() => void onReset()}
                    className="rounded-xl border border-ap-border px-3 py-2 text-xs text-ap-text-muted hover:text-ap-text disabled:opacity-40"
                  >
                    RESET SANDBOX
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                <Stat label="Profiles" value={String(sandboxStatus.profiles)} />
                <Stat
                  label="Existing Likes"
                  value={String(
                    sandboxStatus.outgoingLikes + sandboxStatus.incomingLikes
                  )}
                />
                <Stat label="Matches" value={String(sandboxStatus.matches)} />
                <Stat
                  label="Database"
                  value={
                    sandboxStatus.database === "connected" ? "Connected" : "Unavailable"
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onReset()}
                  className="rounded-xl border border-ap-border px-3 py-2 text-xs text-ap-text-muted hover:text-ap-text disabled:opacity-40"
                >
                  RESET SANDBOX
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void refreshSandbox()}
                  className="rounded-xl border border-ap-border px-3 py-2 text-xs text-ap-text-muted hover:text-ap-text disabled:opacity-40"
                >
                  Refresh status
                </button>
              </div>
            </>
          )}
          {error ? <p className="text-xs text-ap-accent">{error}</p> : null}
        </div>
      ) : (
        <p className="text-xs text-ap-text-dim">
          Demo Mode simulates profiles, likes, and matches locally in your browser.
        </p>
      )}
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
        active
          ? "bg-ap-accent text-white"
          : "text-ap-text-muted hover:text-ap-text",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ap-border-subtle px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-ap-text-dim">{label}</div>
      <div className="mt-0.5 font-medium text-ap-text tabular-nums">{value}</div>
    </div>
  );
}
