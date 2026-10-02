"use client";

import { Eye, Heart, Sparkles, Percent, Play, Square } from "lucide-react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { KpiCard } from "@/components/dashboard/KpiCards";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { SessionControls } from "@/components/dashboard/SessionControls";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { SessionAnalytics } from "@/components/dashboard/SessionAnalytics";
import { cn } from "@/lib/cn";

export function DashboardView() {
  const {
    isRunning,
    status,
    hydrated,
    start,
    stop,
    stats,
    currentProfile,
    showLikeOverlay,
    showMatchCelebration,
  } = useAutopilot();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="font-[family-name:var(--font-syne)] text-3xl sm:text-4xl font-bold tracking-tight text-ap-text">
              AUTOPILOT
            </h1>
            <span className="text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-md border border-ap-border bg-ap-card text-ap-text-muted">
              Local Experiment
            </span>
          </div>
          <p className="text-ap-text-muted text-sm sm:text-base">
            Let it swipe. You do you.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="flex items-center gap-2 rounded-xl border border-ap-border-subtle bg-ap-card px-3 py-2 text-sm">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isRunning ? "bg-ap-success ap-pulse-dot" : "bg-ap-text-dim"
              )}
            />
            <span className="text-ap-text-muted">
              {isRunning ? "Running" : status === "stopped" ? "Stopped" : "Ready"}
            </span>
          </div>

          {isRunning ? (
            <button
              type="button"
              onClick={() => void stop()}
              className="inline-flex items-center gap-2 rounded-xl bg-ap-card border border-ap-border px-4 py-2.5 text-sm font-medium text-ap-text hover:bg-ap-card-hover transition-colors shadow-[0_0_0_1px_rgba(255,77,109,0.15)]"
            >
              <Square className="h-3.5 w-3.5 fill-ap-accent text-ap-accent" />
              STOP AUTOPILOT
            </button>
          ) : (
            <button
              type="button"
              disabled={!hydrated}
              onClick={() => void start()}
              className="inline-flex items-center gap-2 rounded-xl bg-ap-accent px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-40 shadow-[0_0_24px_var(--ap-accent-glow)]"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              START AUTOPILOT
            </button>
          )}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Profiles Viewed" value={stats.profilesViewed} icon={Eye} />
        <KpiCard label="Likes Sent" value={stats.likesSent} icon={Heart} accent />
        <KpiCard label="Matches" value={stats.matches} icon={Sparkles} />
        <KpiCard
          label="Match Rate"
          value={stats.matchRate * 100}
          decimals={1}
          suffix="%"
          icon={Percent}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-3 order-2 xl:order-1">
          <SessionControls />
        </div>
        <div className="xl:col-span-5 order-1 xl:order-2">
          <ProfileCard
            profile={currentProfile}
            showLike={showLikeOverlay}
            showMatch={showMatchCelebration}
          />
        </div>
        <div className="xl:col-span-4 order-3">
          <ActivityFeed />
        </div>
      </div>

      <SessionAnalytics />
    </div>
  );
}
