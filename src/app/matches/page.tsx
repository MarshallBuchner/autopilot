"use client";

import { useMemo } from "react";
import { Heart, X } from "lucide-react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { ProfilePortrait } from "@/components/profile/ProfilePortrait";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeMinutes } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { MatchRecord } from "@/lib/types";

export default function MatchesPage() {
  const { matches, hydrated, selectedMatchId, setSelectedMatchId } = useAutopilot();

  const selected = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
          Matches
        </h1>
        <div className="ap-card h-40 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
          Matches
        </h1>
        <p className="mt-1 text-sm text-ap-text-muted">
          Matches from your AUTOPILOT sessions. Messaging is not included.
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="ap-card">
          <EmptyState
            icon={Heart}
            title="No matches yet"
            description="Keep the simulator running — matches appear at roughly 5–12% probability and are saved locally."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-2">
            {matches.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => setSelectedMatchId(match.id)}
                className={cn(
                  "w-full flex items-center gap-4 ap-card-flat p-3 sm:p-4 text-left transition-colors hover:bg-ap-card-hover",
                  selected?.id === match.id &&
                    "border-[rgba(255,77,109,0.35)] bg-ap-accent-soft"
                )}
              >
                <MatchAvatar profile={match.profile} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ap-text truncate">
                    {match.profile.firstName}, {match.profile.age}
                  </div>
                  <div className="text-xs text-ap-text-muted mt-0.5">
                    Matched {formatRelativeMinutes(match.matchedAt)}
                  </div>
                  <div className="text-[11px] text-ap-text-dim mt-1 font-mono truncate">
                    Session {match.sessionId}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selected ? (
              <MatchDetails match={selected} onClose={() => setSelectedMatchId(null)} />
            ) : (
              <div className="ap-card p-8 text-center text-sm text-ap-text-dim">
                Select a match to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MatchAvatar({ profile }: { profile: MatchRecord["profile"] }) {
  return (
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl sm:h-14 sm:w-14">
      <ProfilePortrait profile={profile} compact className="h-full rounded-xl" />
    </div>
  );
}

function MatchDetails({
  match,
  onClose,
}: {
  match: MatchRecord;
  onClose: () => void;
}) {
  const { profile } = match;
  return (
    <div className="ap-card p-5 space-y-4 sticky top-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <MatchAvatar profile={profile} />
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-semibold">
              {profile.firstName}, {profile.age}
            </h2>
            <p className="text-xs text-ap-text-muted">
              Matched {formatRelativeMinutes(match.matchedAt)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-ap-text-dim hover:text-ap-text hover:bg-ap-bg"
          aria-label="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <Row label="Distance" value={`${profile.distanceKm} km away`} />
        <Row label="Occupation" value={profile.occupation} />
        <Row label="Bio" value={`“${profile.bio}”`} />
        <Row label="Session ID" value={match.sessionId} mono />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {profile.interests.map((i) => (
          <span
            key={i}
            className="text-xs px-2.5 py-1 rounded-lg border border-ap-border text-ap-text-muted bg-ap-bg"
          >
            {i}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-ap-text-dim border-t border-ap-border-subtle pt-3">
        Demo match only — no messaging or third-party connection.
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ap-text-dim">{label}</div>
      <div className={cn("mt-0.5 text-ap-text", mono && "font-mono text-xs break-all")}>
        {value}
      </div>
    </div>
  );
}
