"use client";

import { useState } from "react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { DatingPreferencesPanel } from "@/components/settings/DatingPreferencesPanel";
import { cn } from "@/lib/cn";
import { SANDBOX_CURRENT_USER } from "@/lib/sandbox/seed";

const MAX_PRESETS = [25, 50, 100, 250] as const;

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    clearAllData,
    hydrated,
    isRunning,
    environment,
    sandboxStatus,
    sandboxInspect,
    sandboxConnection,
    refreshSandbox,
    initializeSandbox,
    resetSandbox,
  } = useAutopilot();
  const [cleared, setCleared] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [busy, setBusy] = useState(false);
  const isCustom = !MAX_PRESETS.includes(
    settings.defaultMaxProfiles as (typeof MAX_PRESETS)[number]
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <div className="ap-card h-40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
          Settings
        </h1>
        <p className="text-ap-text-muted text-sm mt-1">
          Defaults applied when you start a new session.
        </p>
      </header>

      <DatingPreferencesPanel />

      <section className="ap-card p-5 space-y-5">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold">
          Defaults
        </h2>

        <div>
          <div className="text-xs uppercase tracking-wide text-ap-text-dim mb-2">
            Default max profiles
          </div>
          <div className="flex flex-wrap gap-2">
            {MAX_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateSettings({ defaultMaxProfiles: n })}
                className={cn(
                  "min-w-[52px] rounded-lg px-3 py-1.5 text-sm border transition-colors",
                  settings.defaultMaxProfiles === n && !isCustom
                    ? "border-ap-accent bg-ap-accent-soft text-ap-text"
                    : "border-ap-border text-ap-text-muted hover:text-ap-text"
                )}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                if (!isCustom) updateSettings({ defaultMaxProfiles: 75 });
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm border transition-colors",
                isCustom
                  ? "border-ap-accent bg-ap-accent-soft text-ap-text"
                  : "border-ap-border text-ap-text-muted hover:text-ap-text"
              )}
            >
              Custom
            </button>
          </div>
          {isCustom && (
            <input
              type="number"
              min={1}
              max={1000}
              value={settings.defaultMaxProfiles}
              onChange={(e) =>
                updateSettings({
                  defaultMaxProfiles: Math.max(
                    1,
                    Math.min(1000, Number(e.target.value) || 1)
                  ),
                })
              }
              className="mt-2 w-full rounded-lg bg-ap-bg border border-ap-border px-3 py-2 text-sm outline-none focus:border-ap-accent"
            />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-ap-text-dim">
              Default delay
            </div>
            <div className="text-sm tabular-nums">
              {settings.defaultDelaySeconds.toFixed(1)}s
            </div>
          </div>
          <input
            type="range"
            className="ap-slider"
            min={1}
            max={10}
            step={0.5}
            value={settings.defaultDelaySeconds}
            onChange={(e) =>
              updateSettings({ defaultDelaySeconds: Number(e.target.value) })
            }
          />
        </div>

        <ToggleRow
          label="Randomize timing"
          description="Default for new sessions"
          checked={settings.randomizeTiming}
          onChange={(v) => updateSettings({ randomizeTiming: v })}
        />

        <ToggleRow
          label="Stop after max profiles"
          description="Default for new sessions"
          checked={settings.stopAfterMax}
          onChange={(v) => updateSettings({ stopAfterMax: v })}
        />
      </section>

      <section className="ap-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold">
              Live Sandbox
            </h2>
            <p className="text-sm text-ap-text-muted mt-1 leading-relaxed">
              Controlled local backend for persisted likes and reciprocal matches. Not a
              production dating service.
            </p>
          </div>
          <span className="rounded-md border border-ap-border px-2 py-1 text-[10px] uppercase tracking-wider text-ap-text-muted shrink-0">
            {environment === "live_sandbox" ? "Active" : "Idle"}
          </span>
        </div>

        <div className="rounded-xl border border-ap-border-subtle bg-ap-bg/50 p-3 space-y-2 text-sm">
          <Row
            label="Current user"
            value={`${SANDBOX_CURRENT_USER.firstName}, ${SANDBOX_CURRENT_USER.age}`}
          />
          <Row
            label="Backend status"
            value={
              sandboxStatus
                ? sandboxStatus.available
                  ? sandboxStatus.initialized
                    ? `Connected · ${sandboxStatus.profiles} profiles`
                    : "Ready · not initialized"
                  : "LOCAL SETUP REQUIRED"
                : sandboxConnection === "connecting"
                  ? "Connecting…"
                  : "Not checked"
            }
          />
          <Row
            label="Outgoing likes"
            value={String(sandboxStatus?.outgoingLikes ?? "—")}
          />
          <Row
            label="Incoming likes"
            value={String(sandboxStatus?.incomingLikes ?? "—")}
          />
          <Row label="Passes" value={String(sandboxStatus?.passes ?? "—")} />
          <Row label="Decisions" value={String(sandboxStatus?.decisions ?? "—")} />
          <Row label="Matches" value={String(sandboxStatus?.matches ?? "—")} />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || isRunning}
            onClick={() => {
              setBusy(true);
              void initializeSandbox()
                .catch(() => undefined)
                .finally(() => setBusy(false));
            }}
            className="rounded-xl bg-ap-accent px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            Initialize sandbox
          </button>
          <button
            type="button"
            disabled={busy || isRunning}
            onClick={() => {
              if (
                !window.confirm(
                  "Reset Live Sandbox? This clears all sandbox Likes and Matches and restores the initial test dataset."
                )
              ) {
                return;
              }
              setBusy(true);
              void resetSandbox()
                .catch(() => undefined)
                .finally(() => setBusy(false));
            }}
            className="rounded-xl border border-ap-border px-3 py-2 text-xs text-ap-text-muted hover:text-ap-text disabled:opacity-40"
          >
            Reset sandbox
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void refreshSandbox().finally(() => setBusy(false));
            }}
            className="rounded-xl border border-ap-border px-3 py-2 text-xs text-ap-text-muted hover:text-ap-text disabled:opacity-40"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => {
              setShowInspector((v) => !v);
              if (!showInspector) void refreshSandbox();
            }}
            className="rounded-xl border border-ap-border px-3 py-2 text-xs text-ap-text-muted hover:text-ap-text"
          >
            {showInspector ? "Hide sandbox data" : "VIEW SANDBOX DATA"}
          </button>
        </div>

        {showInspector ? (
          <pre className="max-h-80 overflow-auto rounded-xl border border-ap-border-subtle bg-ap-bg p-3 text-[11px] text-ap-text-muted leading-relaxed">
            {JSON.stringify(
              {
                status: sandboxStatus,
                connection: sandboxConnection,
                currentUser: sandboxInspect?.currentUser ?? SANDBOX_CURRENT_USER,
                outgoingLikes: sandboxInspect?.outgoingLikes ?? [],
                incomingLikes: sandboxInspect?.incomingLikes ?? [],
                passes: sandboxInspect?.passes ?? [],
                decisions: sandboxInspect?.decisions ?? [],
                matches: sandboxInspect?.matches ?? [],
              },
              null,
              2
            )}
          </pre>
        ) : null}
      </section>

      <section className="ap-card p-5 space-y-4">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold">
          Privacy
        </h2>
        <p className="text-sm text-ap-text-muted leading-relaxed">
          Demo session data lives in your browser. Live Sandbox likes and matches persist in
          a local SQLite database under <code className="text-xs text-ap-accent">data/</code>.
          No third-party dating credentials are collected.
        </p>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => {
            clearAllData();
            setCleared(true);
            setTimeout(() => setCleared(false), 2000);
          }}
          className="rounded-xl px-4 py-2.5 text-sm border border-ap-border text-ap-text-muted hover:text-ap-accent hover:border-ap-accent transition-colors disabled:opacity-40"
        >
          {cleared ? "Local data cleared" : "Clear local browser data"}
        </button>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-ap-text-dim">{label}</span>
      <span className="text-sm text-ap-text text-right">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm text-ap-text">{label}</div>
        <div className="text-[11px] text-ap-text-dim mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors shrink-0",
          checked ? "bg-ap-accent" : "bg-ap-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
