# AUTOPILOT

**An experimental local-first automation dashboard.**

> “Let it swipe. You do you.”

AUTOPILOT is a polished V0.1 weekend project: a dark premium desktop dashboard for exploring automation UX — **entirely in Demo Mode**. It does not connect to Tinder or any dating platform.

---

## Overview

AUTOPILOT simulates a swipe/like loop with fictional profiles, live KPIs, an activity feed, session analytics, and local history. The UI is built against an `AutomationAdapter` interface so a future local helper could plug in without rewriting the dashboard.

**This is a personal/open-source experiment, not a commercial SaaS.**

| | |
|---|---|
| Stack | Next.js (App Router) · TypeScript · Tailwind CSS · Lucide · Recharts |
| Persistence | `localStorage` only |
| Auth / DB / paid APIs | None |
| Deploy | Vercel-ready static/SSR Next app |

---

## Demo

1. Open the **Dashboard**
2. Choose max profiles & action delay
3. Click **START AUTOPILOT**
4. Watch the profile simulator, LIKE overlays, occasional **MATCH!** events, KPIs, and activity feed
5. Stop manually or let it finish at the max profile limit
6. Inspect **Sessions** / **Matches**, or **Export** JSON/CSV

Everything you see is generated locally by `DemoAutomationAdapter`.

---

## Features

- **Dashboard** — start/stop, KPIs, session controls, live profile card, activity feed, analytics chart
- **Like Everyone** simulation with configurable delay + optional randomized timing
- **Simulated matches** (~5–12% probability)
- **Sessions** — completed run history with charts
- **Matches** — local match list + details panel
- **Settings** — defaults, privacy copy, clear local data
- **About** — disclaimer & architecture notes
- Subtle motion: profile transitions, LIKE overlay, match celebration, KPI ticks, activity inserts, status pulse

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
        ├── DemoAutomationAdapter   ← V0.1 (ships)
        └── (future local adapter)  ← not implemented
```

### `AutomationAdapter`

| Method | Role |
|---|---|
| `connect()` / `disconnect()` | Lifecycle |
| `start(config)` / `stop()` | Session control |
| `getStatus()` | `disconnected` · `connected` · `running` · `stopped` · `error` |

| Event | Payload |
|---|---|
| `profileLoaded` | Demo profile |
| `actionPerformed` | `{ profile, action: "like" }` |
| `matchDetected` | Demo profile |
| `statusChanged` | Adapter status |
| `sessionComplete` | `{ reason }` |
| `error` | `{ message }` |

The dashboard **never** embeds simulator timers directly — it only listens to adapter events.

> **Important:** The included V0.1 adapter is **simulation-only**. It does not scrape profiles, call private APIs, bypass anti-bot systems, or automate a real dating account.

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Deploy to Vercel with the default Next.js preset — no env vars required.

---

## Privacy

AUTOPILOT stores demo/session data locally in your browser (`localStorage`). No account credentials are collected by this V0.1 build. Clear everything from **Settings → Clear local data**.

---

## Disclaimer

AUTOPILOT is an **unofficial experimental project**.

It is **not affiliated with, endorsed by, or sponsored by** Tinder, Match Group, Bumble, Hinge, or any dating platform.

V0.1 operates **entirely in simulation mode** and does not interact with third-party dating services.

Do **not** use Tinder logos or copyrighted screenshots/assets with this project. The AUTOPILOT mark is an original abstract navigation/automation identity.

---

## Roadmap

### V0.2 (ideas)

- AI Selective mode (still demo-first, or offline heuristics)
- Richer fictional profile generators
- Session comparison / trends across history
- Import/export of full local archive
- Optional adapter stubs / docs for a *user-owned* local helper — still no unofficial API reverse-engineering in-repo

### Explicitly out of scope for V0.1

- Real dating-platform connections
- Scraping / private API clients
- Accounts, cloud sync, or paid services

---

## License

Use and modify freely for personal and open-source experimentation. Respect third-party trademarks and terms of service — this project does not grant permission to automate or scrape any dating service.
