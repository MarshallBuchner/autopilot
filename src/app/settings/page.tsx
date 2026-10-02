"use client";

import { useState } from "react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { cn } from "@/lib/cn";

const MAX_PRESETS = [25, 50, 100, 250] as const;

export default function SettingsPage() {
  const { settings, updateSettings, clearAllData, hydrated, isRunning } = useAutopilot();
  const [cleared, setCleared] = useState(false);
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
          Defaults applied when you start a new demo session.
        </p>
      </header>

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
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold">
          Privacy
        </h2>
        <p className="text-sm text-ap-text-muted leading-relaxed">
          AUTOPILOT stores demo/session data locally in your browser. No account credentials
          are collected by this V0.1 build.
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
          {cleared ? "Local data cleared" : "Clear local data"}
        </button>
      </section>
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
