"use client";

import { useRouter } from "next/navigation";
import type { SessionCompleteSummary } from "@/lib/types";
import { formatDuration, formatMatchRate } from "@/lib/format";

export function SessionCompleteModal({
  summary,
  onRunAgain,
  onExport,
  onDismiss,
}: {
  summary: SessionCompleteSummary;
  onRunAgain: () => void;
  onExport: () => void;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const { session, reason } = summary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm ap-animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-complete-title"
    >
      <div className="ap-card w-full max-w-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
        <div className="text-[11px] uppercase tracking-[0.16em] text-ap-accent">
          {reason === "max_profiles" ? "Limit reached" : "Session ended"}
        </div>
        <h2
          id="session-complete-title"
          className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight"
        >
          SESSION COMPLETE
        </h2>
        <p className="mt-1 text-sm text-ap-text-muted">
          Demo run finished. Stats are saved locally in your browser.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Stat label="Profiles Viewed" value={String(session.profilesViewed)} />
          <Stat label="Likes Sent" value={String(session.likesSent)} />
          <Stat label="Matches" value={String(session.matches)} accent />
          <Stat label="Match Rate" value={formatMatchRate(session.matchRate)} />
          <Stat
            label="Duration"
            value={formatDuration(session.durationMs)}
            className="col-span-2"
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onRunAgain}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-ap-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_var(--ap-accent-glow)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent"
          >
            Run again
          </button>
          <button
            type="button"
            onClick={() => {
              onDismiss();
              router.push("/sessions");
            }}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-ap-border px-4 py-2.5 text-sm text-ap-text transition hover:bg-ap-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent"
          >
            View session
          </button>
          <button
            type="button"
            onClick={onExport}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-ap-border px-4 py-2.5 text-sm text-ap-text-muted transition hover:text-ap-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent"
          >
            Export results
          </button>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 w-full text-center text-xs text-ap-text-dim transition hover:text-ap-text-muted"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  className = "",
}: {
  label: string;
  value: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-ap-border-subtle bg-ap-bg p-3 ${className}`}
    >
      <div className="text-[10px] uppercase tracking-wide text-ap-text-dim">{label}</div>
      <div
        className={`mt-1 font-[family-name:var(--font-syne)] text-lg font-semibold tabular-nums ${
          accent ? "text-ap-accent" : "text-ap-text"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
