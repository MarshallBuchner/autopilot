"use client";

import { useAutopilot } from "@/context/AutopilotProvider";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export function ActivityFeed() {
  const { activity } = useAutopilot();

  return (
    <div className="ap-card p-5 flex flex-col min-h-[320px] max-h-[560px]">
      <div className="mb-4">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight">
          Live Activity
        </h2>
        <p className="text-xs text-ap-text-muted mt-1">Newest events first · last 50</p>
      </div>

      <div className="ap-scroll flex-1 overflow-y-auto space-y-1 pr-1">
        {activity.length === 0 ? (
          <p className="text-sm text-ap-text-dim py-8 text-center">No activity yet.</p>
        ) : (
          activity.map((evt, i) => (
            <div
              key={evt.id}
              className={cn(
                "flex gap-3 rounded-lg px-2 py-2 text-sm",
                i === 0 && "ap-animate-activity bg-ap-bg/60"
              )}
            >
              <span className="text-[11px] text-ap-text-dim tabular-nums shrink-0 pt-0.5 font-mono">
                {formatTime(evt.timestamp)}
              </span>
              <span
                className={cn(
                  "leading-snug",
                  evt.type === "match" && "text-ap-accent font-medium",
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
