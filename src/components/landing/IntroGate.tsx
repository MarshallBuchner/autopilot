"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Sparkles, MonitorSmartphone, Code2 } from "lucide-react";
import { AutopilotMark } from "@/components/brand/AutopilotMark";
import { SITE } from "@/lib/site";

const INTRO_KEY = "autopilot.v02.introDismissed";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 .5C5.73.5.5 5.74.5 12.02c0 5.1 3.29 9.43 7.86 10.96.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.73.08-.72.08-.72 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.25 5.69.42.36.79 1.08.79 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.74 18.27.5 12 .5Z" />
    </svg>
  );
}

export function IntroGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(INTRO_KEY) === "1";
    } catch {
      dismissed = false;
    }
    startTransition(() => {
      setShowIntro(!dismissed);
      setReady(true);
    });
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(INTRO_KEY, "1");
    } catch {
      // ignore
    }
    setShowIntro(false);
  };

  if (!ready) {
    return <>{children}</>;
  }

  if (!showIntro) {
    return <>{children}</>;
  }

  return (
    <div className="ap-app-bg relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-ap-accent/10 blur-3xl" />
        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-fuchsia-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-10 sm:px-8 lg:py-16">
        <div className="mb-10 flex items-center gap-3">
          <AutopilotMark className="h-9 w-9" />
          <div>
            <div className="font-[family-name:var(--font-syne)] text-sm font-bold tracking-tight">
              AUTOPILOT
            </div>
            <div className="text-[11px] text-ap-text-dim">
              {SITE.version} · local experiment
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="max-w-xl ap-animate-fade-up">
            <h1 className="font-[family-name:var(--font-syne)] text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              AUTOPILOT
            </h1>
            <p className="mt-3 text-lg text-ap-text-muted sm:text-xl">{SITE.tagline}</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ap-text-dim sm:text-base">
              A weekend experiment exploring what dating autopilot could look like —
              currently powered by a local simulation engine.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex items-center gap-2 rounded-xl bg-ap-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_0_28px_var(--ap-accent-glow)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent"
              >
                Launch demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={SITE.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-ap-border px-5 py-3 text-sm text-ap-text-muted transition hover:border-ap-text-dim hover:text-ap-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ap-accent"
              >
                <GitHubIcon className="h-4 w-4" />
                View on GitHub
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { label: "Local", icon: MonitorSmartphone },
                { label: "Private", icon: Lock },
                { label: "Simulation only", icon: Sparkles },
                { label: "Open source", icon: Code2 },
              ].map(({ label, icon: Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-ap-border-subtle bg-ap-card/80 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-ap-text-muted"
                >
                  <Icon className="h-3 w-3 text-ap-text-dim" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="ap-card relative w-full max-w-md overflow-hidden p-4 ap-animate-fade-up sm:p-5">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-ap-text-dim">
              <span>Dashboard preview</span>
              <span className="text-ap-success">Demo engine</span>
            </div>
            <div className="rounded-xl border border-ap-border-subtle bg-ap-bg p-4">
              <div className="font-[family-name:var(--font-syne)] text-lg font-semibold">
                Live AUTOPILOT session
              </div>
              <p className="mt-1 text-xs text-ap-text-muted">
                Watch fictional profiles load, get liked, and occasionally match —
                entirely in your browser.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                {[
                  ["Profiles", "0"],
                  ["Likes", "0"],
                  ["Matches", "0"],
                  ["Rate", "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-ap-border-subtle bg-ap-card px-2 py-3"
                  >
                    <div className="text-[10px] uppercase text-ap-text-dim">{label}</div>
                    <div className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-ap-text-dim">
              No dating credentials. No scraping. Simulation only.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center text-xs text-ap-text-dim">
          Prefer skipping ahead?{" "}
          <button
            type="button"
            onClick={dismiss}
            className="text-ap-text-muted underline-offset-2 hover:text-ap-text hover:underline"
          >
            Enter dashboard
          </button>
          {" · "}
          <Link href="/about" className="hover:text-ap-text-muted">
            About
          </Link>
        </div>
      </div>
    </div>
  );
}
