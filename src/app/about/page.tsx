import Link from "next/link";
import { AutopilotMark } from "@/components/brand/AutopilotMark";
import { SITE } from "@/lib/site";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start gap-4">
        <AutopilotMark className="h-12 w-12 shrink-0" />
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight sm:text-4xl">
            AUTOPILOT
          </h1>
          <p className="mt-1 text-sm text-ap-text-muted sm:text-base">
            An experimental open-source dating automation dashboard.
          </p>
          <p className="mt-1 text-xs text-ap-text-dim">{SITE.version}</p>
        </div>
      </header>

      <section className="ap-card space-y-4 p-5 text-sm leading-relaxed text-ap-text-muted">
        <p>
          AUTOPILOT began as a weekend experiment exploring what an automated matching
          dashboard could look like — session control, live feedback, and a pluggable
          automation surface.
        </p>
        <p>
          AUTOPILOT supports isolated <span className="text-ap-text">Demo</span> and{" "}
          <span className="text-ap-text">Live Sandbox</span> environments. Neither
          connects to Tinder, Bumble, Hinge, or any production dating service.
        </p>
        <p>
          AUTOPILOT is an independent experimental project and is{" "}
          <span className="text-ap-text">
            not affiliated with, endorsed by, or sponsored by
          </span>{" "}
          Tinder, Match Group, Bumble, Hinge, or any other dating platform.
        </p>
      </section>

      <section className="ap-card space-y-3 p-5 text-sm">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-ap-text">
          Demo Mode
        </h2>
        <p className="leading-relaxed text-ap-text-muted">
          Uses <code className="text-xs text-ap-accent">DemoAutomationAdapter</code> and
          fictional profiles for a completely local demonstration. Matches are simulated
          in the frontend. No dating-platform credentials are required.
        </p>
      </section>

      <section className="ap-card space-y-3 p-5 text-sm">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-ap-text">
          Live Sandbox
        </h2>
        <p className="leading-relaxed text-ap-text-muted">
          Uses <code className="text-xs text-ap-accent">SandboxAutomationAdapter</code>{" "}
          against an AUTOPILOT-owned local SQLite backend. Profiles, likes, and matches
          persist. A match exists only when both users have liked each other. Requires
          local setup — not available as persistent storage on typical Vercel deployments.
        </p>
      </section>

      <section className="ap-card space-y-3 p-5 text-sm">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-ap-text">
          Adapter Architecture
        </h2>
        <p className="leading-relaxed text-ap-text-muted">
          AUTOPILOT communicates through the{" "}
          <code className="text-xs text-ap-accent">AutomationAdapter</code> interface so
          authorized or self-hosted environments can be integrated without rewriting the
          UI. This project does not imply that Tinder, Bumble, Hinge, or any other
          third-party dating platform is currently supported.
        </p>
      </section>

      <section className="ap-card space-y-2 p-5 text-sm text-ap-text-muted">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-ap-text">
          Privacy
        </h2>
        <p>
          Demo session history lives in{" "}
          <code className="text-xs text-ap-text">localStorage</code>. Live Sandbox likes
          and matches persist in a local SQLite database under{" "}
          <code className="text-xs text-ap-text">data/</code>. Clear browser data anytime
          from Settings.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/"
          className="rounded-xl bg-ap-accent px-4 py-2.5 font-medium text-white transition hover:brightness-110"
        >
          Open dashboard
        </Link>
        <a
          href={SITE.githubUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-ap-border px-4 py-2.5 text-ap-text-muted transition hover:text-ap-text"
        >
          GitHub
        </a>
      </div>
    </div>
  );
}
