"use client";

import { useAutopilot } from "@/context/AutopilotProvider";
import {
  INTEREST_OPTIONS,
  RELATIONSHIP_GOAL_OPTIONS,
  type RelationshipGoal,
} from "@/lib/selective/types";
import { cn } from "@/lib/cn";

export function DatingPreferencesPanel() {
  const {
    datingPreferences: prefs,
    updateDatingPreferences,
    resetDatingPreferences,
    isRunning,
  } = useAutopilot();

  const toggleGoal = (goal: RelationshipGoal) => {
    const has = prefs.preferredRelationshipGoals.includes(goal);
    updateDatingPreferences({
      preferredRelationshipGoals: has
        ? prefs.preferredRelationshipGoals.filter((g) => g !== goal)
        : [...prefs.preferredRelationshipGoals, goal],
    });
  };

  const toggleInterest = (interest: string) => {
    const has = prefs.preferredInterests.includes(interest);
    updateDatingPreferences({
      preferredInterests: has
        ? prefs.preferredInterests.filter((i) => i !== interest)
        : [...prefs.preferredInterests, interest],
    });
  };

  return (
    <section className="ap-card p-5 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold">
            Dating Preferences
          </h2>
          <p className="text-sm text-ap-text-muted mt-1 leading-relaxed">
            Controls <span className="text-ap-text">AI Selective</span>. Required filters
            can force a PASS. Preferred settings influence the compatibility score.
          </p>
        </div>
        <button
          type="button"
          disabled={isRunning}
          onClick={() => resetDatingPreferences()}
          className="shrink-0 rounded-xl border border-ap-border px-3 py-2 text-xs text-ap-text-muted hover:text-ap-text disabled:opacity-40"
        >
          Reset preferences
        </button>
      </div>

      <div className="space-y-3">
        <SectionLabel
          title="Age range"
          badge="Required"
          hint={`${prefs.minAge}–${prefs.maxAge}`}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Min age"
            value={prefs.minAge}
            min={18}
            max={prefs.maxAge}
            disabled={isRunning}
            onChange={(v) => updateDatingPreferences({ minAge: v })}
          />
          <NumberField
            label="Max age"
            value={prefs.maxAge}
            min={prefs.minAge}
            max={80}
            disabled={isRunning}
            onChange={(v) => updateDatingPreferences({ maxAge: v })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel
          title="Maximum distance"
          badge="Required"
          hint={`${prefs.maxDistanceKm} km`}
        />
        <input
          type="range"
          className="ap-slider"
          min={5}
          max={100}
          step={1}
          disabled={isRunning}
          value={prefs.maxDistanceKm}
          onChange={(e) =>
            updateDatingPreferences({ maxDistanceKm: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-3">
        <SectionLabel
          title="Selective threshold"
          badge="Decision"
          hint={`${prefs.likeThreshold}%`}
        />
        <p className="text-[11px] text-ap-text-dim">
          Profiles scoring at or above this threshold receive a Like.
        </p>
        <input
          type="range"
          className="ap-slider"
          min={50}
          max={90}
          step={1}
          disabled={isRunning}
          value={prefs.likeThreshold}
          onChange={(e) =>
            updateDatingPreferences({ likeThreshold: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-3">
        <SectionLabel title="Preferred relationship goals" badge="Preferred" />
        <div className="flex flex-wrap gap-2">
          {RELATIONSHIP_GOAL_OPTIONS.map((opt) => {
            const active = prefs.preferredRelationshipGoals.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isRunning}
                onClick={() => toggleGoal(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                  active
                    ? "border-ap-accent bg-ap-accent-soft text-ap-text"
                    : "border-ap-border text-ap-text-muted hover:text-ap-text",
                  isRunning && "opacity-40"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel title="Preferred interests" badge="Preferred" />
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => {
            const active = prefs.preferredInterests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                disabled={isRunning}
                onClick={() => toggleInterest(interest)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] transition-colors",
                  active
                    ? "border-ap-accent bg-ap-accent-soft text-ap-text"
                    : "border-ap-border text-ap-text-muted hover:text-ap-text",
                  isRunning && "opacity-40"
                )}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <SectionLabel title="Lifestyle" badge="Mixed" />
        <Segmented
          label="Smoking"
          value={prefs.smokingPreference}
          disabled={isRunning}
          options={[
            { value: "any", label: "Any" },
            { value: "non_smoker_preferred", label: "Non-smoker preferred" },
            { value: "non_smoker_required", label: "Non-smoker required" },
          ]}
          onChange={(v) =>
            updateDatingPreferences({
              smokingPreference: v as typeof prefs.smokingPreference,
            })
          }
        />
        <Segmented
          label="Activity"
          value={prefs.activityPreference}
          disabled={isRunning}
          options={[
            { value: "any", label: "Any" },
            { value: "active_preferred", label: "Active preferred" },
          ]}
          onChange={(v) =>
            updateDatingPreferences({
              activityPreference: v as typeof prefs.activityPreference,
            })
          }
        />
        <Segmented
          label="Children"
          value={prefs.childrenPreference}
          disabled={isRunning}
          options={[
            { value: "any", label: "Any" },
            { value: "no_children_preferred", label: "No children preferred" },
            { value: "wants_children_aligned", label: "Wants children aligned" },
          ]}
          onChange={(v) =>
            updateDatingPreferences({
              childrenPreference: v as typeof prefs.childrenPreference,
            })
          }
        />
      </div>
    </section>
  );
}

function SectionLabel({
  title,
  badge,
  hint,
}: {
  title: string;
  badge: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="text-xs uppercase tracking-wide text-ap-text-dim">{title}</div>
        <span className="rounded border border-ap-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ap-text-dim">
          {badge}
        </span>
      </div>
      {hint ? <div className="text-sm tabular-nums text-ap-text">{hint}</div> : null}
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-ap-text-dim">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        disabled={disabled}
        value={value}
        onChange={(e) =>
          onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))
        }
        className="mt-1 w-full rounded-lg bg-ap-bg border border-ap-border px-3 py-2 text-sm outline-none focus:border-ap-accent disabled:opacity-40"
      />
    </label>
  );
}

function Segmented({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wide text-ap-text-dim">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors",
              value === opt.value
                ? "border-ap-accent bg-ap-accent-soft text-ap-text"
                : "border-ap-border text-ap-text-muted hover:text-ap-text",
              disabled && "opacity-40"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
