import { AutopilotMark } from "@/components/brand/AutopilotMark";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <header className="flex items-start gap-4">
        <AutopilotMark className="h-12 w-12 shrink-0" />
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold tracking-tight">
            About
          </h1>
          <p className="text-ap-text-muted text-sm mt-1">
            AUTOPILOT · unofficial experimental project · v0.1
          </p>
        </div>
      </header>

      <section className="ap-card p-5 space-y-4 text-sm text-ap-text-muted leading-relaxed">
        <p>
          <span className="text-ap-text font-medium">AUTOPILOT</span> is an unofficial
          experimental project. It is a personal/open-source local-first automation dashboard
          for exploring UI and architecture ideas around session control, live feedback, and
          pluggable adapters.
        </p>
        <p>
          It is <span className="text-ap-text">not affiliated with, endorsed by, or sponsored
          by</span> Tinder, Match Group, Bumble, Hinge, or any dating platform.
        </p>
        <p>
          <span className="text-ap-text font-medium">V0.1 operates entirely in simulation
          mode</span> and does not interact with third-party dating services. There is no
          scraping, no private API access, and no real account automation in this build.
        </p>
        <p>
          Do not use Tinder logos or copyrighted screenshots/assets with this project. The
          AUTOPILOT mark is an original abstract navigation/automation identity.
        </p>
      </section>

      <section className="ap-card p-5 space-y-3 text-sm">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-ap-text">
          Architecture note
        </h2>
        <p className="text-ap-text-muted leading-relaxed">
          The dashboard speaks to an <code className="text-ap-accent text-xs">AutomationAdapter</code>{" "}
          interface. V0.1 ships <code className="text-ap-accent text-xs">DemoAutomationAdapter</code>{" "}
          only. A future local browser-extension helper could implement the same contract
          without rewriting the UI — that adapter is intentionally not included here.
        </p>
      </section>

      <section className="ap-card p-5 space-y-2 text-sm text-ap-text-muted">
        <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold text-ap-text">
          Privacy
        </h2>
        <p>
          Session history, matches, and settings persist in <code className="text-xs text-ap-text">localStorage</code>.
          Nothing is sent to a backend. Clear data anytime from Settings.
        </p>
      </section>
    </div>
  );
}
