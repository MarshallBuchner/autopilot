# AUTOPILOT

**I got tired of swiping, so I built AUTOPILOT.**

An experimental open-source dating automation dashboard built around a pluggable adapter architecture.

> “Let it swipe. You do you.”

AUTOPILOT ships two environments:

| Mode | Adapter | Persistence |
|---|---|---|
| **Demo** | `DemoAutomationAdapter` | Browser `localStorage` (simulated likes/matches) |
| **Live Sandbox** | `SandboxAutomationAdapter` | Local SQLite backend (real persisted likes/matches) |

Neither mode connects to Tinder, Bumble, Hinge, or any production dating service. No credentials, no scraping, no private APIs.

---

## Demo Mode

Local simulation of the AUTOPILOT experience:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Launch AUTOPILOT**, keep **DEMO** selected, then **START AUTOPILOT**.

Profiles are fictional. Matches are simulated (~5–12% probability) inside `DemoAutomationAdapter`. Session analytics persist in `localStorage`.

The public Vercel deployment is fully functional in Demo Mode.

---

## Live Sandbox

V0.3 introduces a controlled backend environment where:

- profiles are backend records
- likes persist
- reciprocal likes create matches
- matches persist
- no production dating service is involved

### Architecture

```
AUTOPILOT UI
     ↓
AutopilotProvider
     ↓
AutomationAdapter
     ├── DemoAutomationAdapter      ← Demo Mode
     └── SandboxAutomationAdapter   ← Live Sandbox
              ↓
         Sandbox API  (/api/sandbox/*)
              ↓
         Sandbox Database  (SQLite → data/sandbox.db)
```

### Local setup (copy/paste)

```bash
# install
npm install

# initialize + seed SQLite (Alex + ~40 profiles + reciprocal likes)
npm run sandbox:init

# run the app
npm run dev
```

In the dashboard:

1. Select **LIVE SANDBOX**
2. Confirm status shows **SANDBOX CONNECTED** (or click **INITIALIZE SANDBOX**)
3. **START AUTOPILOT**

Test user (not a real account):

- **Alex**, 29 (`user-alex`)

Seeded reciprocal likes (already in the DB before you start):

- Grace → Alex, Sophie → Alex, Maya → Alex, and several others

When AUTOPILOT likes Grace, the backend detects Grace → Alex and creates **MATCH: Alex ↔ Grace**. There is no `Math.random()` match logic in Live Sandbox.

### Useful commands

```bash
# re-seed / restore reciprocal likes
npm run sandbox:reset

# inspect via API while the app is running
curl -s http://localhost:3000/api/sandbox/status | jq
curl -s http://localhost:3000/api/sandbox/inspect | jq
curl -s http://localhost:3000/api/sandbox/matches | jq

# quality
npm run lint
npm run typecheck
npm run build
npm test
```

Database file: `data/sandbox.db` (gitignored). Override location with:

```bash
SANDBOX_DATA_DIR=/tmp/autopilot-sandbox npm run sandbox:init
SANDBOX_DATA_DIR=/tmp/autopilot-sandbox npm run dev
```

### API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/sandbox/status` | Availability + counts |
| `POST` | `/api/sandbox/initialize` | Create schema + seed |
| `POST` | `/api/sandbox/reset` | Clear likes/matches, restore seed |
| `GET` | `/api/sandbox/profiles/next` | Next eligible profile for Alex |
| `POST` | `/api/sandbox/likes` | `{ "toUserId": "..." }` — persist like, maybe match |
| `GET` | `/api/sandbox/matches` | Persisted matches for Alex |
| `GET` | `/api/sandbox/inspect` | Developer snapshot |

### Reset

**RESET SANDBOX** (dashboard / Settings) or `npm run sandbox:reset`:

- clears likes
- clears matches
- restores seed users
- restores predefined reciprocal likes toward Alex

Demo Mode reset remains separate (**Reset Demo** on the analytics panel).

---

## Public deployment (Vercel)

Live Sandbox needs a writable local SQLite file. Vercel’s serverless filesystem is ephemeral and unsuitable for this experiment.

On Vercel:

- **Demo Mode** works normally
- **Live Sandbox** reports **LOCAL SETUP REQUIRED**
- AUTOPILOT does **not** silently fall back to Demo while claiming Sandbox is connected

Run Live Sandbox locally (or on a host with a persistent disk).

---

## Duolicious investigation

We evaluated [Duolicious](https://github.com/duolicious/duolicious) as a self-hosted backend candidate.

**Conclusion: do not integrate for V0.3.**

- AGPL licensing would constrain AUTOPILOT’s packaging story
- Interaction model is message/Q&A oriented, not a clean Like → reciprocal Match loop
- Local stack is comparatively heavy for this experiment
- Open-source ≠ permission to automate Duolicious production — and even self-hosting would distort AUTOPILOT’s Like/Match model

V0.3 therefore ships an AUTOPILOT-owned minimal sandbox (SQLite + internal API).

---

## Features

- Mode switcher: **DEMO** / **LIVE SANDBOX**
- Same dashboard for both adapters
- START / STOP with connection-aware gating in Live Sandbox
- Like Everyone mode (AI Selective marked coming later)
- LIKE overlay + card exit motion + MATCH celebration
- KPI strip, activity feed, session analytics
- Matches & Sessions pages (sandbox matches read from the backend)
- Sandbox data inspector in Settings
- JSON / CSV export
- Responsive layout

---

## Tech stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Lucide icons
- Recharts
- `better-sqlite3` (Live Sandbox only)
- `localStorage` (Demo sessions / settings)

---

## Tests

```bash
npm test
```

Covers sandbox seed/like/match/reset semantics, `SandboxAutomationAdapter` backend wiring, and existing Demo adapter smoke coverage.

Optional UI smoke (Playwright + server on :3000):

```bash
npx playwright install chromium
node scripts/ui-smoke.mjs
```

---

## Privacy

- Demo: browser `localStorage`
- Live Sandbox: local `data/sandbox.db`
- No third-party dating credentials are collected

---

## Disclaimer

AUTOPILOT is an **independent experimental project**.

It is **not affiliated with, endorsed by, or sponsored by** Tinder, Match Group, Bumble, Hinge, or any other dating platform.

Do not use third-party trademarks or copyrighted dating-app assets with this project.

---

## Roadmap

- AI Selective mode
- Session comparisons / trends
- Richer sandbox tooling

This roadmap does **not** promise unofficial third-party dating-platform automation.

---

## License

Use and modify freely for personal and open-source experimentation. Respect third-party trademarks and terms of service — this project does not grant permission to automate or scrape any dating service.
