"use client";

import { MapPin, Briefcase } from "lucide-react";
import { useAutopilot } from "@/context/AutopilotProvider";
import type { DemoProfile } from "@/lib/types";
import type { SelectiveEvaluation } from "@/lib/selective/types";
import { ProfilePortrait } from "@/components/profile/ProfilePortrait";
import { cn } from "@/lib/cn";

export function ProfileCard({
  profile,
  showLike,
  showPass,
  exiting,
  exitDirection = "right",
  isRunning,
  evaluation,
}: {
  profile: DemoProfile | null;
  showLike: boolean;
  showPass?: boolean;
  exiting?: boolean;
  exitDirection?: "left" | "right";
  isRunning?: boolean;
  evaluation?: SelectiveEvaluation | null;
}) {
  const { environment, config } = useAutopilot();
  const selective = config.mode === "ai_selective";

  if (!profile) {
    return (
      <div className="ap-card relative flex min-h-[360px] flex-col items-center justify-center p-6 text-center sm:min-h-[420px]">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-ap-border-subtle bg-ap-bg">
          <div className="h-2 w-2 rounded-full bg-ap-text-dim" />
        </div>
        <p className="max-w-[240px] text-sm font-medium text-ap-text">Ready when you are.</p>
        <p className="mt-2 max-w-[260px] text-xs text-ap-text-muted">
          {environment === "live_sandbox"
            ? "Start AUTOPILOT to begin a Live Sandbox session."
            : "Start AUTOPILOT to begin a Demo Mode session."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "ap-card relative overflow-hidden p-3 sm:p-4",
        isRunning && "ap-session-active"
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ap-text-dim">
          Live session
        </div>
        <span className="rounded-md border border-ap-border bg-ap-bg/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-ap-text-muted">
          {selective ? "AI Selective" : "Demo profile"}
        </span>
      </div>

      <div
        key={profile.id}
        className={cn(
          "relative",
          exiting
            ? exitDirection === "left"
              ? "ap-animate-profile-exit-left"
              : "ap-animate-profile-exit"
            : "ap-animate-profile"
        )}
      >
        <div className="relative">
          <ProfilePortrait profile={profile} />

          {showLike && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="ap-animate-like rounded-2xl border-[3px] border-ap-accent bg-black/45 px-6 py-2.5 shadow-[0_0_48px_var(--ap-accent-glow)] backdrop-blur-sm">
                <span className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-[0.18em] text-ap-accent sm:text-4xl">
                  LIKE
                </span>
              </div>
            </div>
          )}

          {showPass && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="ap-animate-like rounded-2xl border-[3px] border-[rgba(160,170,190,0.65)] bg-black/45 px-6 py-2.5 backdrop-blur-sm">
                <span className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-[0.18em] text-ap-text-muted sm:text-4xl">
                  PASS
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3.5 space-y-2.5 sm:mt-4 sm:space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {profile.firstName}
                <span className="text-ap-text-muted">, {profile.age}</span>
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ap-text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-ap-text-dim" aria-hidden />
                  {profile.distanceKm} km away
                </span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-ap-text-dim" aria-hidden />
                  {profile.occupation}
                </span>
              </div>
            </div>
            {selective && evaluation ? (
              <div
                className={cn(
                  "shrink-0 rounded-xl border px-2.5 py-1.5 text-right",
                  evaluation.decision === "LIKE"
                    ? "border-[rgba(61,214,140,0.35)] bg-ap-success-soft"
                    : "border-ap-border bg-ap-bg/80"
                )}
              >
                <div className="font-[family-name:var(--font-syne)] text-lg font-bold tabular-nums leading-none">
                  {evaluation.score}%
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-ap-text-dim">
                  Fit
                </div>
              </div>
            ) : null}
          </div>

          {selective && evaluation ? (
            <div className="flex flex-wrap gap-1.5">
              {evaluation.highlightChips.map((chip) => (
                <span
                  key={`${chip.label}-${chip.ok}`}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-wide",
                    chip.ok
                      ? "border-[rgba(61,214,140,0.3)] text-ap-success"
                      : "border-ap-border text-ap-text-dim"
                  )}
                >
                  {chip.label} {chip.ok ? "✓" : "✕"}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-sm leading-relaxed text-ap-text-muted">
            &ldquo;{profile.bio}&rdquo;
          </p>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="rounded-lg border border-ap-border/80 bg-ap-bg/70 px-2.5 py-1 text-[11px] text-ap-text-muted"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
