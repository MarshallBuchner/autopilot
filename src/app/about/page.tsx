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
            An experimental local-first automation dashboard.
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
          <span className="font-medium text-ap-text">V0.2 runs entirely through a local
          simulation engine.</span>{" "}
          No dating-platform credentials are required. No real dating accounts are accessed.
          No profiles are scraped. No third-party dating APIs are called.
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
          Architecture
        </h2>
        <p className="leading-relaxed text-ap-text-muted">
          The dashboard speaks to an{" "}
          <code className="text-xs text-ap-accent">AutomationAdapter</code> interface. V0.2
          ships{" "}
          <code className="text-xs text-ap-accent">DemoAutomationAdapter</code> only — a
          local simulator that emits profile, like, and match events. Another local adapter
          could theoretically implement the same contract later without rewriting the UI.
          That real-world adapter is intentionally not included.
        </p>
      </section>

      <section className="ap-card space-y-2 p-5 text-sm text-ap-text-muted">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-ap-text">
          Privacy
        </h2>
        <p>
          Session history, matches, and settings persist in{" "}
          <code className="text-xs text-ap-text">localStorage</code>. Nothing is sent to a
          backend. Clear data anytime from Settings.
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
