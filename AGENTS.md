# AGENTS.md

## Project goal
This is Business Model 02 of a 30-project learning series. The user is learning the business itself while using AI to develop the app. Preserve explanatory UX and business-state transitions.

## Non-negotiable rules
- Read README.md, docs/BUSINESS_FLOW.md, docs/DATA_MODEL.md, and docs/FEATURE_MATRIX.md before major changes.
- Do not remove working features to simplify a refactor.
- Never present simulated messaging, payment, refunds, authentication, or booking-platform actions as real integrations.
- Preserve the flow: booking request -> deposit -> confirm -> attendance/cancel/no-show -> open slot -> waitlist offer -> acceptance -> recovered booking -> reports.
- Domain rules belong in src/domain, not duplicated in UI pages.
- Keep local data safe on failed saves/restores.
- Use sample/anonymous data only. Never commit secrets or real customer data.
- Run tests and builds before commit when dependencies are available.

## Session start and scope
- Work only inside the currently selected repository (`02-reservation-noshow-dashboard`). Do not browse, read, or modify other numbered projects (01, 03, ...) or parent folders.
- At the start of every new session, read `PROJECT_STATE.md` and `BUSINESS_MODEL.md` first. They hold the current phase, known risks, and the backlog. The next task is whatever the user assigns; backlog items are not started unless the user asks. Update `PROJECT_STATE.md` when a task is finished.

## Workflow
- One P0 at a time. Do not start the next P0 or mix unrelated changes into one commit.
- Reproduce before fixing: show the problem (a failing regression test) first, then make the smallest change.
- Add regression tests for every fix and keep all existing tests passing.
- Do not commit or push until the user has approved the verified diff (diff, tests, builds, secrets check).
- GitHub `main` is the source of truth. Vercel is the real deployment target (production URL in `PROJECT_STATE.md`). Do not add a GitHub Pages workflow.

## Verification
Prefer:
`npm run typecheck && npm run typecheck:domain && npm test && npm run build && npm run build:vite`

`package-lock.json` is committed: prefer `npm ci` over `npm install` for clean installs and in CI (`.github/workflows/ci.yml` does).
