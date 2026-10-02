"use client";

import { useAutopilot } from "@/context/AutopilotProvider";
import { cn } from "@/lib/cn";

const MAX_PRESETS = [25, 50, 100, 250] as const;

export function SessionControls() {
  const { config, setConfig, isRunning } = useAutopilot();
  const isCustom = !MAX_PRESETS.includes(config.maxProfiles as (typeof MAX_PRESETS)[number]);

  return (
    <div className="ap-card p-5 space-y-5">
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight">
          Session Controls
        </h2>
        <p className="mt-1 text-xs text-ap-text-muted">Configure your AUTOPILOT session.</p>
      </div>

      <div>
        <div className="mb-2 text-xs uppercase tracking-wide text-ap-text-dim">Mode</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={isRunning}
            onClick={() => setConfig({ mode: "like_everyone" })}
            className={cn(
              "rounded-xl border px-3 py-3 text-left text-sm transition-colors",
              config.mode === "like_everyone"
                ? "border-ap-accent bg-ap-accent-soft text-ap-text"
                : "border-ap-border text-ap-text-muted hover:border-ap-text-dim"
            )}
          >
            <div className="font-medium">Like Everyone</div>
            <div className="mt-0.5 text-[11px] text-ap-text-dim">
              Automatically like each profile.
            </div>
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl border border-ap-border-subtle px-3 py-3 text-left text-sm text-ap-text-dim opacity-60"
          >
            <div className="flex items-center gap-2 font-medium">
              AI Selective
              <span className="rounded border border-ap-border bg-ap-bg px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                Coming later
              </span>
            </div>
            <div className="mt-0.5 text-[11px]">
              Use your preferences to decide who gets a Like.
            </div>
          </button>
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-ap-text-dim mb-2">Max Profiles</div>
        <div className="flex flex-wrap gap-2">
          {MAX_PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              disabled={isRunning}
              onClick={() => setConfig({ maxProfiles: n })}
              className={cn(
                "min-w-[52px] rounded-lg px-3 py-1.5 text-sm border transition-colors",
                config.maxProfiles === n && !isCustom
                  ? "border-ap-accent bg-ap-accent-soft text-ap-text"
                  : "border-ap-border text-ap-text-muted hover:text-ap-text"
              )}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={isRunning}
            onClick={() => {
              if (!isCustom) setConfig({ maxProfiles: 75 });
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
            disabled={isRunning}
            value={config.maxProfiles}
            onChange={(e) =>
              setConfig({
                maxProfiles: Math.max(1, Math.min(1000, Number(e.target.value) || 1)),
              })
            }
            className="mt-2 w-full rounded-lg bg-ap-bg border border-ap-border px-3 py-2 text-sm text-ap-text outline-none focus:border-ap-accent"
          />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-ap-text-dim">Action Delay</div>
          <div className="text-sm tabular-nums text-ap-text">
            {config.actionDelaySeconds.toFixed(1)}s
          </div>
        </div>
        <input
          type="range"
          className="ap-slider"
          min={1}
          max={10}
          step={0.5}
          disabled={isRunning}
          value={config.actionDelaySeconds}
          onChange={(e) => setConfig({ actionDelaySeconds: Number(e.target.value) })}
        />
        <div className="flex justify-between text-[11px] text-ap-text-dim mt-1">
          <span>1s</span>
          <span>10s</span>
        </div>
      </div>

      <ToggleRow
        label="Randomize Timing"
        description="Vary intervals around the selected delay"
        checked={config.randomizeTiming}
        disabled={isRunning}
        onChange={(v) => setConfig({ randomizeTiming: v })}
      />

      <ToggleRow
        label="Stop After Max Profiles"
        description="End the session automatically at the limit"
        checked={config.stopAfterMax}
        disabled={isRunning}
        onChange={(v) => setConfig({ stopAfterMax: v })}
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
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
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors shrink-0",
          checked ? "bg-ap-accent" : "bg-ap-border",
          disabled && "opacity-50 cursor-not-allowed"
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
