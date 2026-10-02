"use client";

import { Activity } from "lucide-react";
import { useAutopilot } from "@/context/AutopilotProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ActivityFeed() {
  const { activity } = useAutopilot();

  return (
    <div className="ap-card flex max-h-[420px] min-h-[260px] flex-col p-4 sm:max-h-[560px] sm:min-h-[320px] sm:p-5">
      <div className="mb-3 sm:mb-4">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight">
          Live Activity
        </h2>
        <p className="mt-1 text-xs text-ap-text-muted">Newest events first · last 50</p>
      </div>

      <div className="ap-scroll flex-1 space-y-1 overflow-y-auto pr-1">
        {activity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No activity yet"
            description="Start AUTOPILOT to begin the simulation. Profile loads, likes, and matches will stream here."
          />
        ) : (
          activity.map((evt, i) => (
            <div
              key={evt.id}
              className={cn(
                "flex gap-3 rounded-lg px-2 py-2 text-sm",
                i === 0 && "ap-animate-activity bg-ap-bg/60"
              )}
            >
              <span className="shrink-0 pt-0.5 font-mono text-[11px] tabular-nums text-ap-text-dim">
                {formatTime(evt.timestamp)}
              </span>
              <span
                className={cn(
                  "leading-snug",
                  evt.type === "match" && "font-medium text-ap-accent",
                  evt.type === "error" && "text-ap-warning",
                  evt.type === "liked" && "text-ap-text",
                  evt.type === "profile_loaded" && "text-ap-text-muted",
                  (evt.type === "session_start" || evt.type === "session_stop") &&
                    "text-ap-text-muted",
                  evt.type === "info" && "text-ap-text-muted"
                )}
              >
                {evt.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
