"use client";

import type { CSSProperties } from "react";
import { X } from "lucide-react";
import type { DemoProfile } from "@/lib/types";
import { ProfilePortrait } from "@/components/profile/ProfilePortrait";

export function MatchOverlay({
  profile,
  onDismiss,
}: {
  profile: DemoProfile;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md ap-animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Match found"
    >
      <div className="ap-match-particles pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="ap-particle"
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>

      <div className="ap-animate-match relative w-full max-w-sm rounded-2xl border border-[rgba(255,77,109,0.35)] bg-ap-card p-6 text-center shadow-[0_0_80px_var(--ap-accent-glow)]">
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-ap-text-dim transition-colors hover:bg-ap-bg hover:text-ap-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent"
          aria-label="Dismiss match"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_28px_var(--ap-accent-glow)] sm:text-4xl">
          IT&apos;S A MATCH
        </div>
        <p className="mt-1.5 text-xs uppercase tracking-[0.16em] text-ap-accent">
          Simulated match
        </p>

        <div className="mx-auto mt-5 w-36 overflow-hidden rounded-2xl ring-2 ring-ap-accent/40 sm:w-40">
          <ProfilePortrait profile={profile} compact />
        </div>

        <div className="mt-4 font-[family-name:var(--font-syne)] text-xl font-semibold">
          {profile.firstName}, {profile.age}
        </div>
        <p className="mt-1 text-sm text-ap-text-muted">{profile.occupation}</p>
      </div>
    </div>
  );
}
