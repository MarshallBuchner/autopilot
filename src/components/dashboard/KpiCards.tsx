"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/cn";

export function KpiCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  icon: Icon,
  accent,
  emphasize,
  compact,
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  accent?: boolean;
  emphasize?: boolean;
  compact?: boolean;
}) {
  const prev = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (value !== prev.current) {
      setPulse(true);
      prev.current = value;
      const t = window.setTimeout(() => setPulse(false), 420);
      return () => window.clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className={cn(
        "ap-card ap-animate-fade-up",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
        emphasize && "border-[rgba(255,77,109,0.28)] shadow-[0_0_0_1px_rgba(255,77,109,0.08)]",
        pulse && "ap-kpi-pulse"
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 text-[10px] uppercase tracking-wide text-ap-text-muted sm:mb-2 sm:text-xs">
            {label}
          </div>
          <div
            className={cn(
              "font-[family-name:var(--font-syne)] font-semibold tracking-tight",
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl",
              emphasize || accent ? "text-ap-accent" : "text-ap-text"
            )}
          >
            <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          </div>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-xl p-2 sm:p-2.5",
            emphasize || accent
              ? "bg-ap-accent-soft text-ap-accent"
              : "bg-ap-bg text-ap-text-muted"
          )}
        >
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
    </div>
  );
}
