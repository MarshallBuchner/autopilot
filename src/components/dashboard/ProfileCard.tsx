"use client";

import { MapPin, Briefcase } from "lucide-react";
import type { DemoProfile } from "@/lib/types";
import { cn } from "@/lib/cn";

function AbstractAvatar({ hue, name }: { hue: number; name: string }) {
  const initial = name.slice(0, 1).toUpperCase();
  return (
    <div
      className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 30% 25%, hsla(${hue}, 70%, 62%, 0.55), transparent 45%),
          radial-gradient(circle at 75% 70%, hsla(${(hue + 40) % 360}, 55%, 45%, 0.4), transparent 50%),
          linear-gradient(160deg, hsl(${hue}, 25%, 18%) 0%, hsl(${(hue + 20) % 360}, 20%, 10%) 100%)
        `,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-[family-name:var(--font-syne)] text-7xl sm:text-8xl font-bold text-white/25 select-none"
          aria-hidden
        >
          {initial}
        </span>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  );
}

export function ProfileCard({
  profile,
  showLike,
  showMatch,
}: {
  profile: DemoProfile | null;
  showLike: boolean;
  showMatch: boolean;
}) {
  if (!profile) {
    return (
      <div className="ap-card p-6 flex flex-col items-center justify-center min-h-[420px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-ap-bg border border-ap-border-subtle flex items-center justify-center mb-4">
          <div className="h-2 w-2 rounded-full bg-ap-text-dim" />
        </div>
        <p className="text-ap-text-muted text-sm max-w-[220px]">
          Press <span className="text-ap-text">START AUTOPILOT</span> to load simulated
          profiles.
        </p>
      </div>
    );
  }

  return (
    <div
      key={profile.id}
      className="ap-card p-4 sm:p-5 relative overflow-hidden ap-animate-profile"
    >
      <div className="relative">
        <AbstractAvatar hue={profile.avatarHue} name={profile.firstName} />

        {showLike && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="ap-animate-like rounded-2xl border-4 border-ap-accent px-5 py-2 bg-black/40 backdrop-blur-sm shadow-[0_0_40px_var(--ap-accent-glow)]">
              <span className="font-[family-name:var(--font-syne)] text-3xl font-bold text-ap-accent tracking-wider">
                LIKE
              </span>
            </div>
          </div>
        )}

        {showMatch && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/45 backdrop-blur-[2px]">
            <div className="ap-animate-match text-center">
              <div className="font-[family-name:var(--font-syne)] text-4xl sm:text-5xl font-bold text-white drop-shadow-[0_0_24px_var(--ap-accent-glow)]">
                MATCH!
              </div>
              <div className="mt-2 text-ap-accent text-sm tracking-wide">
                Simulated connection
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <h3 className="font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
            {profile.firstName}, {profile.age}
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-ap-text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-ap-text-dim" />
              {profile.distanceKm} km away
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-ap-text-dim" />
              {profile.occupation}
            </span>
          </div>
        </div>

        <p className="text-sm text-ap-text-muted leading-relaxed">&ldquo;{profile.bio}&rdquo;</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className={cn(
                "text-xs px-2.5 py-1 rounded-lg border border-ap-border text-ap-text-muted bg-ap-bg"
              )}
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
