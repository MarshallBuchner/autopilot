"use client";

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
}: {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <div className="ap-card p-4 sm:p-5 ap-animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-ap-text-muted tracking-wide uppercase mb-2">
            {label}
          </div>
          <div
            className={cn(
              "font-[family-name:var(--font-syne)] text-2xl sm:text-3xl font-semibold tracking-tight",
              accent ? "text-ap-accent" : "text-ap-text"
            )}
          >
            <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
          </div>
        </div>
        <div
          className={cn(
            "rounded-xl p-2.5",
            accent ? "bg-ap-accent-soft text-ap-accent" : "bg-ap-bg text-ap-text-muted"
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
    </div>
  );
}
