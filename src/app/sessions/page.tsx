"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { History } from "lucide-react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDuration, formatMatchRate } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CompletedSession } from "@/lib/types";

export default function SessionsPage() {
  const { sessions, hydrated } = useAutopilot();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!sessions.length) return null;
    const id = selectedId ?? sessions[0]?.id;
    return sessions.find((s) => s.id === id) ?? null;
  }, [sessions, selectedId]);

  if (!hydrated) {
    return <PageSkeleton title="Sessions" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
          Sessions
        </h1>
        <p className="text-ap-text-muted text-sm mt-1">
          Completed demo runs stored locally in your browser.
        </p>
      </header>

      {sessions.length === 0 ? (
        <div className="ap-card">
          <EmptyState
            icon={History}
            title="No previous sessions"
            description="Run AUTOPILOT from the Dashboard. Completed demo runs are stored locally in your browser."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2 space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedId(session.id)}
                className={cn(
                  "w-full text-left ap-card-flat p-4 transition-colors hover:bg-ap-card-hover",
                  selected?.id === session.id &&
                    "border-[rgba(255,77,109,0.35)] bg-ap-accent-soft"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ap-text">
                    {formatDate(session.startedAt)}
                  </span>
                  <span className="text-xs text-ap-text-dim tabular-nums">
                    {formatDuration(session.durationMs)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ap-text-muted">
                  <span>{session.profilesViewed} profiles</span>
                  <span>{session.likesSent} likes</span>
                  <span>{session.matches} matches</span>
                  <span>{formatMatchRate(session.matchRate)}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selected ? <SessionDetail session={selected} /> : null}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionDetail({ session }: { session: CompletedSession }) {
  return (
    <div className="ap-card p-5 space-y-5">
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">
          Session detail
        </h2>
        <p className="text-xs text-ap-text-dim mt-1 font-mono">{session.id}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Metric label="Date" value={formatDate(session.startedAt)} />
        <Metric label="Duration" value={formatDuration(session.durationMs)} />
        <Metric label="Profiles viewed" value={String(session.profilesViewed)} />
        <Metric label="Likes" value={String(session.likesSent)} />
        <Metric label="Matches" value={String(session.matches)} />
        <Metric label="Match rate" value={formatMatchRate(session.matchRate)} />
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={session.analytics}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
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
            />
            <Area
              type="monotone"
              dataKey="likes"
              name="Likes"
              stroke="#ff4d6d"
              fill="rgba(255,77,109,0.15)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="matches"
              name="Matches"
              stroke="#3dd68c"
              fill="rgba(61,214,140,0.12)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="text-xs text-ap-text-dim border-t border-ap-border-subtle pt-3">
        Mode: Like Everyone · Max {session.config.maxProfiles} · Delay{" "}
        {session.config.actionDelaySeconds}s
        {session.config.randomizeTiming ? " · Randomized" : ""}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ap-bg border border-ap-border-subtle p-3">
      <div className="text-[11px] uppercase tracking-wide text-ap-text-dim">{label}</div>
      <div className="mt-1 text-sm font-medium text-ap-text">{value}</div>
    </div>
  );
}

function PageSkeleton({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
        {title}
      </h1>
      <div className="ap-card h-40 animate-pulse bg-ap-card" />
    </div>
  );
}
