# Duolicious investigation (V0.3)

Repository reviewed: https://github.com/duolicious/duolicious

## Question

Can AUTOPILOT use a self-hosted Duolicious instance as the Live Sandbox backend for persisted likes and reciprocal matches?

## Findings

- **License:** AGPL — would constrain how AUTOPILOT is packaged and distributed.
- **Product model:** Conversation / Q&A oriented matching, not a clean swipe Like → reciprocal Match loop aligned with AUTOPILOT’s dashboard events.
- **Ops complexity:** Multi-service local stack is heavier than this experiment needs.
- **Boundary:** Open-source code does **not** imply permission to automate Duolicious’s public hosted service. Production connection was never considered.

## Decision

**Do not integrate Duolicious for V0.3.**

Ship an AUTOPILOT-owned minimal sandbox instead:

- SQLite (`better-sqlite3`) under `data/sandbox.db`
- Internal `/api/sandbox/*` routes
- `SandboxAutomationAdapter` implementing the existing `AutomationAdapter` contract

This keeps Demo Mode unchanged and proves real persisted reciprocal matching without distorting AUTOPILOT’s Like/Match model.
