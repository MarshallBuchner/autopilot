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
import { useAutopilot } from "@/context/AutopilotProvider";
import { formatDuration, formatMatchRate } from "@/lib/format";

export function SessionAnalytics() {
  const { stats, resetDemo, exportResults, isRunning } = useAutopilot();

  const data = stats.analytics.length > 0 ? stats.analytics : [{ actionIndex: 0, likes: 0, matches: 0 }];

  return (
    <div className="ap-card p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight">
            Session Analytics
          </h2>
          <p className="text-xs text-ap-text-muted mt-1">
            Cumulative likes & matches across actions
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

      <div className="h-56 w-full">
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
              name="Likes Sent"
              stroke="#ff4d6d"
              fill="url(#likesFill)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 border-t border-ap-border-subtle">
        <Stat label="Duration" value={formatDuration(stats.durationMs)} />
        <Stat label="Profiles" value={String(stats.profilesViewed)} />
        <Stat label="Likes" value={String(stats.likesSent)} />
        <Stat label="Matches" value={String(stats.matches)} />
        <Stat label="Match rate" value={formatMatchRate(stats.matchRate)} />
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
