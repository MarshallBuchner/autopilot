"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  Heart,
  Settings,
  Info,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { AutopilotMark } from "@/components/brand/AutopilotMark";
import { useAutopilot } from "@/context/AutopilotProvider";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: History },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/about", label: "About", icon: Info },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { status, hydrated } = useAutopilot();
  const [open, setOpen] = useState(false);

  const connected =
    hydrated &&
    (status === "connected" || status === "running" || status === "stopped");

  const nav = (
    <>
      <div className="flex items-center gap-3 px-2 mb-8">
        <AutopilotMark className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <div className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-ap-text leading-none">
            AUTOPILOT
          </div>
          <div className="mt-1 text-[11px] tracking-wide text-ap-text-dim">v0.2</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-ap-accent-soft text-ap-text border border-[rgba(255,77,109,0.2)]"
                  : "text-ap-text-muted hover:text-ap-text hover:bg-ap-card-hover border border-transparent"
              )}
            >
              <Icon
                className={cn("h-4 w-4", active ? "text-ap-accent" : "text-ap-text-dim")}
                strokeWidth={1.75}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-ap-border-subtle">
        <div className="flex items-center gap-2 text-xs text-ap-text-muted">
          <span
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              connected ? "bg-ap-success ap-pulse-dot" : "bg-ap-text-dim"
            )}
          />
          <span>{connected ? "Demo engine connected" : "Connecting…"}</span>
        </div>
        <div className="mt-1.5 text-[11px] text-ap-text-dim pl-4">Local only</div>
      </div>
    </>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 border-b border-ap-border-subtle bg-ap-bg/90 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <AutopilotMark className="h-7 w-7" />
          <span className="font-[family-name:var(--font-syne)] font-bold text-sm tracking-tight">
            AUTOPILOT
          </span>
        </div>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg text-ap-text-muted hover:text-ap-text hover:bg-ap-card"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-30">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-14 bottom-0 w-[min(280px,85vw)] bg-ap-bg-elevated border-r border-ap-border-subtle p-4 flex flex-col">
            {nav}
          </aside>
        </div>
      )}

      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[var(--ap-sidebar)] flex-col border-r border-ap-border-subtle bg-ap-bg-elevated/80 backdrop-blur-sm p-5 z-20">
        {nav}
      </aside>
    </>
  );
}
