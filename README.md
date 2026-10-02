# AUTOPILOT

**I got tired of swiping, so I built AUTOPILOT.**

An experimental open-source dating automation dashboard built around a pluggable adapter architecture.

> “Let it swipe. You do you.”

The currently shipped environment is **Demo Mode** via `DemoAutomationAdapter`. It does not connect to Tinder, Bumble, Hinge, or any dating platform. No credentials, no scraping, no private APIs.

---

## Demo

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Launch AUTOPILOT**, then **START AUTOPILOT**.

| | |
|---|---|
| Live app | _Add your deployment URL via `NEXT_PUBLIC_DEPLOY_URL`_ |
| Source | [github.com/MarshallBuchner/autopilot](https://github.com/MarshallBuchner/autopilot) |

---

## What it does

AUTOPILOT is a dark premium desktop dashboard for running automation sessions:

1. Load profiles through the active adapter
2. Wait a configured delay (optionally randomized)
3. Animate a **LIKE**
4. Occasionally celebrate a **MATCH**
5. Track KPIs, activity, analytics, and session history in `localStorage`

In Demo Mode, those profiles are fictional and everything stays in your browser.

---

## Features

- Live AUTOPILOT session with illustrated demo profiles
- START / STOP controls and green **AUTOPILOT RUNNING** status
- Like Everyone mode (AI Selective marked coming later)
- Configurable max profiles, action delay, randomized timing
- LIKE overlay + card exit motion
- MATCH celebration overlay with short auto-continue
- Session complete summary when the profile limit is hit
- KPI strip, live activity feed, session analytics chart
- Matches & Sessions pages with local history
- JSON / CSV export and Reset Demo
- First-visit landing intro
- Responsive mobile layout (~390–430px)

---

## Architecture

```
UI (Dashboard / pages)
        │
        ▼
 AutopilotProvider  ──►  localStorage
        │
        ▼
 AutomationAdapter  (interface)
        │
        └── DemoAutomationAdapter   ← currently shipped (Demo Mode)
```

AUTOPILOT communicates through the `AutomationAdapter` interface so additional authorized or self-hosted environments can be integrated without rewriting the UI. The currently included adapter is `DemoAutomationAdapter`.

This repo does **not** implement real dating-platform automation and does not imply that Tinder, Bumble, Hinge, or any other third-party platform is currently supported.

| Method | Role |
|---|---|
| `connect()` / `disconnect()` | Lifecycle |
| `start(config)` / `stop()` | Session control |
| `getStatus()` | Adapter status |

| Event | Meaning |
|---|---|
| `profileLoaded` | New profile |
| `actionPerformed` | Like action |
| `matchDetected` | Match event |
| `sessionComplete` | Stopped or max reached |

---

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Lucide icons
- Recharts
- `localStorage` persistence

No database. No auth. No paid APIs. No required backend.

---

## Running locally

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run build
```

Optional smoke scripts:

```bash
npx tsx scripts/smoke-adapter.ts
npx tsx scripts/smoke-match-rate.ts
# UI smoke (requires Playwright + a running server on :3000)
npx playwright install chromium
node scripts/ui-smoke.mjs
```

Env (optional):

```bash
NEXT_PUBLIC_GITHUB_URL=https://github.com/MarshallBuchner/autopilot
NEXT_PUBLIC_DEPLOY_URL=https://your-deployment.example
```

---

## Privacy

Demo Mode is local / browser-based. Session data lives in `localStorage`. No account credentials are collected. Clear everything from **Settings → Clear local data**.

---

## Disclaimer

AUTOPILOT is an **independent experimental project**.

It is **not affiliated with, endorsed by, or sponsored by** Tinder, Match Group, Bumble, Hinge, or any other dating platform.

Do not use third-party trademarks or copyrighted dating-app assets with this project. The AUTOPILOT mark is an original abstract navigation / automation identity.

---

## Roadmap

Modest next steps:

- Richer Demo Mode detail
- AI Selective mode
- Session comparisons / trends
- Additional authorized or self-hosted adapter environments

This roadmap does **not** promise unofficial third-party dating-platform automation.

---

## License

Use and modify freely for personal and open-source experimentation. Respect third-party trademarks and terms of service — this project does not grant permission to automate or scrape any dating service.
