# AUTOPILOT

**I got tired of swiping, so I built AUTOPILOT.**

An experimental open-source dating automation dashboard built around a pluggable adapter architecture.

> “Let it swipe. You do you.”

AUTOPILOT ships two environments and two strategies:

| | Demo Mode | Live Sandbox |
|---|---|---|
| **Like Everyone** | Simulated likes/matches in-browser | Persisted likes + reciprocal matches (SQLite) |
| **AI Selective** | Local heuristic LIKE/PASS | Local heuristic + persisted decisions |

Neither mode connects to Tinder, Bumble, Hinge, or any production dating service.

---

## Architecture

```
AUTOPILOT UI
     ↓
 Strategy
 ├── Like Everyone
 └── AI Selective
         ↓
 SelectiveDecisionEngine   ← deterministic, local, explainable
     ↓
AutomationAdapter
├── DemoAutomationAdapter
└── SandboxAutomationAdapter
         ↓
    Sandbox API  (/api/sandbox/*)
         ↓
    SQLite  (data/sandbox.db)
```

---

## Demo Mode

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), launch AUTOPILOT, keep **DEMO** selected.

- **Like Everyone** — likes every profile; matches are simulated (~5–12%).
- **AI Selective** — evaluates each profile with `SelectiveDecisionEngine` against your Dating Preferences.

Works on public Vercel deployments (no SQLite required).

---

## AI Selective

Product name: **AI Selective**  
Technical engine: **`SelectiveDecisionEngine`**

V0.4’s Selective Decision Engine runs **locally** and does **not** send profile data to an external AI provider. It is a configurable heuristic — not a scientifically validated compatibility model, and not an LLM.

### Hard filters vs preferences

| Setting | Type | Effect |
|---|---|---|
| Age range | Required | Outside range → **PASS** |
| Max distance | Required | Too far → **PASS** |
| Non-smoker required | Required (optional) | Smoker → **PASS** |
| Relationship goals | Preferred | Scores alignment |
| Interests | Preferred | Scores shared tags |
| Activity / children | Preferred | Lifestyle score |

### Scoring weights (sum = 100)

| Category | Weight |
|---|---|
| Age fit | 20 |
| Distance fit | 15 |
| Relationship goal | 25 |
| Shared interests | 20 |
| Lifestyle | 20 |

### Threshold

Default **70%**. Profiles at or above the threshold receive a LIKE (unless hard-filtered). Adjustable 50–90 in Settings → Dating Preferences.

### Explainability

Every decision returns a score plus reasons, e.g.:

- **LIKE · 87%** — Preferred age · 8 km away · Long-term · Hockey
- **PASS · 42%** — Outside required age · 61 km away

A high score never creates a Match by itself. Matches still require reciprocal persisted likes (Live Sandbox) or Demo simulation on LIKE only.

---

## Live Sandbox

Controlled local backend (V0.3+) where likes, passes, and matches persist.

```bash
npm install
npm run sandbox:init
npm run dev
```

1. Select **LIVE SANDBOX**
2. Initialize if needed
3. Choose **AI Selective** or **Like Everyone**
4. Configure Dating Preferences
5. **START AUTOPILOT**

Test user: **Alex, 29** (`user-alex`)

Seeded reciprocal likes (e.g. Grace → Alex) enable real matches when Alex likes back.

### Decisions

Live Sandbox records:

```
decisions(userId, profileId, decision, strategy, score, reasons, createdAt)
```

UNIQUE on `(userId, profileId)`. Next-profile excludes liked **or** passed profiles. Reset clears decisions and restores seed data.

### API

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/sandbox/status` | Availability + counts |
| `POST` | `/api/sandbox/initialize` | Seed |
| `POST` | `/api/sandbox/reset` | Restore seed |
| `GET` | `/api/sandbox/profiles/next` | Next unprocessed profile |
| `POST` | `/api/sandbox/likes` | Persist like (+ decision) |
| `POST` | `/api/sandbox/decisions` | Persist LIKE/PASS (+ like if LIKE) |
| `GET` | `/api/sandbox/matches` | Persisted matches |
| `GET` | `/api/sandbox/inspect` | Developer snapshot |

### Vercel

Demo Mode works. Live Sandbox shows **LOCAL SETUP REQUIRED** — no silent fallback claiming Sandbox is connected.

---

## Dating Preferences

Settings → **Dating Preferences** (persisted in `localStorage`):

- Age range (required)
- Max distance (required)
- Selective threshold
- Preferred relationship goals
- Preferred interests
- Smoking / activity / children lifestyle controls
- **Reset preferences**

Defaults are fictional for the Alex test persona (age 24–32, 40 km, long-term + open-to-see, threshold 70%).

---

## Strategy comparison

Sessions record `LIKE_EVERYONE` vs `AI_SELECTIVE`. The Sessions page summarizes historical aggregates. Small samples are not conclusive — AUTOPILOT just displays the data.

---

## Quality

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Optional UI smoke (Playwright + server on :3000):

```bash
npx playwright install chromium
node scripts/ui-smoke.mjs
```

---

## Privacy

- Demo + preferences: browser `localStorage`
- Live Sandbox: local `data/sandbox.db`
- V0.4 Selective Decision Engine is local-only
- No third-party dating credentials

---

## Disclaimer

AUTOPILOT is an **independent experimental project**, not affiliated with Tinder, Match Group, Bumble, Hinge, or any dating platform.

---

## License

Use and modify freely for personal and open-source experimentation. This project does not grant permission to automate or scrape any dating service.
