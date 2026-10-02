"use client";

import { Eye, Heart, Sparkles, Percent, Play, Square } from "lucide-react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { KpiCard } from "@/components/dashboard/KpiCards";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { SessionControls } from "@/components/dashboard/SessionControls";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { SessionAnalytics } from "@/components/dashboard/SessionAnalytics";
import { MatchOverlay } from "@/components/dashboard/MatchOverlay";
import { SessionCompleteModal } from "@/components/dashboard/SessionCompleteModal";
import { cn } from "@/lib/cn";

export function DashboardView() {
  const {
    isRunning,
    status,
    start,
    stop,
    stats,
    currentProfile,
    showLikeOverlay,
    showCardExit,
    showMatchCelebration,
    matchProfile,
    sessionComplete,
    dismissMatch,
    dismissSessionComplete,
    exportResults,
  } = useAutopilot();

  const statusLabel = isRunning
    ? "AUTOPILOT RUNNING"
    : status === "stopped"
      ? "READY"
      : "READY";

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-ap-text sm:text-3xl lg:text-4xl">
              AUTOPILOT
            </h1>
            <span className="rounded-md border border-ap-border bg-ap-card px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-ap-text-muted">
              Local Experiment
            </span>
          </div>
          <p className="text-sm text-ap-text-muted sm:text-base">Let it swipe. You do you.</p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
              isRunning
                ? "border-[rgba(61,214,140,0.35)] bg-ap-success-soft"
                : "border-ap-border-subtle bg-ap-card"
            )}
            aria-live="polite"
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isRunning ? "bg-ap-success ap-pulse-dot" : "bg-ap-text-dim"
              )}
            />
            <span className={cn("text-xs font-medium tracking-wide sm:text-sm", isRunning ? "text-ap-success" : "text-ap-text-muted")}>
              {statusLabel}
            </span>
          </div>

          {isRunning ? (
            <button
              type="button"
              onClick={() => void stop()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-ap-border bg-ap-card px-4 py-2.5 text-sm font-medium text-ap-text transition-colors hover:bg-ap-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent sm:flex-none"
            >
              <Square className="h-3.5 w-3.5 fill-ap-accent text-ap-accent" aria-hidden />
              STOP AUTOPILOT
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void start()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ap-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_var(--ap-accent-glow)] transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent sm:flex-none"
            >
              <Play className="h-3.5 w-3.5 fill-white" aria-hidden />
              START AUTOPILOT
            </button>
          )}
        </div>
      </header>

      {/* Mobile: profile first. Desktop: KPIs then session grid */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-12">
        {/* KPIs — after profile on mobile via order */}
        <div className="order-2 grid grid-cols-2 gap-2 sm:gap-3 xl:order-1 xl:col-span-12 xl:grid-cols-4">
          <KpiCard label="Profiles Viewed" value={stats.profilesViewed} icon={Eye} compact />
          <KpiCard label="Likes Sent" value={stats.likesSent} icon={Heart} accent compact />
          <KpiCard
            label="Matches"
            value={stats.matches}
            icon={Sparkles}
            emphasize
            compact
          />
          <KpiCard
            label="Match Rate"
            value={stats.matchRate * 100}
            decimals={1}
            suffix="%"
            icon={Percent}
            compact
          />
        </div>

        {/* Live session / profile — hero */}
        <div className="order-1 xl:order-2 xl:col-span-5">
          <ProfileCard
            profile={currentProfile}
            showLike={showLikeOverlay}
            exiting={showCardExit}
            isRunning={isRunning}
          />
        </div>

        <div className="order-3 xl:order-3 xl:col-span-3">
          <SessionControls />
        </div>

        <div className="order-4 xl:order-4 xl:col-span-4">
          <ActivityFeed />
        </div>
      </div>

      <div className="order-5">
        <SessionAnalytics />
      </div>

      {showMatchCelebration && matchProfile ? (
        <MatchOverlay profile={matchProfile} onDismiss={dismissMatch} />
      ) : null}

      {sessionComplete ? (
        <SessionCompleteModal
          summary={sessionComplete}
          onRunAgain={() => {
            dismissSessionComplete();
            void start();
          }}
          onExport={() => exportResults("json")}
          onDismiss={dismissSessionComplete}
        />
      ) : null}
    </div>
  );
}
