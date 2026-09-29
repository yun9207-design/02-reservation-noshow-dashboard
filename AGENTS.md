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

## Verification
Prefer:
`npm run typecheck && npm run typecheck:domain && npm test && npm run build && npm run build:vite`

If package-lock.json is added later, prefer `npm ci` over `npm install` in CI.
