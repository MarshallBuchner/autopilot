"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDuration, formatMatchRate } from "@/lib/format";

export function SessionAnalytics() {
  const { stats, resetDemo, exportResults, isRunning, config } = useAutopilot();
  const selective = config.mode === "ai_selective";

  const hasData = stats.likesSent > 0 || stats.passes > 0 || stats.profilesViewed > 0;
  const data =
    stats.analytics.length > 0
      ? stats.analytics
      : [{ actionIndex: 0, likes: 0, passes: 0, matches: 0, avgFitScore: 0 }];

  return (
    <div className="ap-card space-y-5 p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight">
            Session Analytics
          </h2>
          <p className="mt-1 text-xs text-ap-text-muted">
            {selective
              ? "Likes, passes, and matches across evaluated profiles"
              : "Cumulative likes & matches across actions"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetDemo}
            disabled={isRunning}
            className="rounded-xl px-3 py-2 text-xs border border-ap-border text-ap-text-muted hover:text-ap-text hover:border-ap-text-dim transition-colors disabled:opacity-40"
          >
            Reset Demo
          </button>
          <button
            type="button"
            onClick={() => exportResults("json")}
            className="rounded-xl px-3 py-2 text-xs border border-ap-border text-ap-text-muted hover:text-ap-text hover:border-ap-text-dim transition-colors"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => exportResults("csv")}
            className="rounded-xl px-3 py-2 text-xs bg-ap-accent-soft border border-[rgba(255,77,109,0.25)] text-ap-accent hover:bg-[rgba(255,77,109,0.22)] transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="h-48 w-full sm:h-56">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="likesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff4d6d" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff4d6d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="matchesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3dd68c" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3dd68c" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="passesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b8b96" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b8b96" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1f1f24" strokeDasharray="3 3" />
              <XAxis
                dataKey="actionIndex"
                tick={{ fill: "#5c5c68", fontSize: 11 }}
                axisLine={{ stroke: "#2a2a30" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5c5c68", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#141417",
                  border: "1px solid #2a2a30",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#8b8b96" }}
                itemStyle={{ color: "#f5f5f7" }}
                labelFormatter={(v) => `Action ${v}`}
              />
              <Area
                type="monotone"
                dataKey="likes"
                name="Likes"
                stroke="#ff4d6d"
                fill="url(#likesFill)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              {selective ? (
                <Area
                  type="monotone"
                  dataKey="passes"
                  name="Passes"
                  stroke="#8b8b96"
                  fill="url(#passesFill)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : null}
              <Area
                type="monotone"
                dataKey="matches"
                name="Matches"
                stroke="#3dd68c"
                fill="url(#matchesFill)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="Analytics will appear here"
            description="Start AUTOPILOT to plot session decisions and matches."
          />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1 border-t border-ap-border-subtle">
        <Stat label="Duration" value={formatDuration(stats.durationMs)} />
        <Stat label="Evaluated" value={String(stats.profilesViewed)} />
        <Stat label="Likes" value={String(stats.likesSent)} />
        <Stat label="Passes" value={String(stats.passes)} />
        <Stat
          label={selective ? "Like rate" : "Match rate"}
          value={formatMatchRate(selective ? stats.likeRate : stats.matchRate)}
        />
        <Stat
          label={selective ? "Avg fit" : "Matches"}
          value={
            selective ? `${stats.averageFitScore}%` : String(stats.matches)
          }
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2">
      <div className="text-[11px] uppercase tracking-wide text-ap-text-dim">{label}</div>
      <div className="mt-1 text-sm font-medium tabular-nums text-ap-text">{value}</div>
    </div>
  );
}
