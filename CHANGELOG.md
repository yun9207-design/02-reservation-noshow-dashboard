# Changelog

## Unreleased · after v1.0.0 (main @ `21da4f4`, 2026-09-30)

### Added
- **P0-3 · deposit state integrity** (`21da4f4`): the engine can no longer create a reservation/deposit combination that contradicts itself, and every deposit transition leaves an audit entry. Domain rules live in `src/domain/rules.ts` (`depositClosed`, `canPayDeposit`, `cancellationDecision`, `canMarkNoShow`) and `src/domain/engine.ts`; the Schedule, Reservations, Waitlist and Learn screens follow them. 22 regression tests added and 1 rewritten (97 → 118), including a randomised command-sequence test that checks no contradictory state appears and that every state is a valid backup.
  - Paying a deposit is rejected on cancelled, completed and no-show reservations (mock payment works on requested, confirmed and arrived only); the pay button is shown only when `canPayDeposit` is true.
  - An arrived reservation can no longer be cancelled (engine, `cancellationDecision` and the buttons); after arrival it can only be completed.
  - Only a confirmed reservation can be marked no-show, after start + grace time. A requested or arrived reservation never becomes a no-show. A paid deposit is forfeited (forfeit option on) or refunded (option off) and the audit entry says which.
  - Whether a deposit is required, and its amount, is fixed when the reservation is created. Switching the `requireDeposit` policy afterwards never changes existing reservations (manual, CSV and waitlist-accepted alike); confirming is blocked by the reservation's own `unpaid` state, not by the policy switch.
  - Accepting a waitlist offer now creates a `requested` + `unpaid` recovery reservation when a deposit is owed (it holds the slot; confirm after a mock payment). With no deposit owed it is `confirmed` + `not_required` at once. This differs from the first proposal (create it as `paid`); it removes the cause of "paid without a payment step".
- **P0-1 · policy value validation** (`529dcf1`): one definition of usable values for slot minutes, opening/closing hour, cancellation hours, no-show grace and offer hold (`src/domain/policy.ts`). `updatePolicy` and the Policies screen reject bad values; localStorage loading and backup restore replace unusable numbers with defaults and write an audit entry; `candidateSlots` can no longer loop forever on a bad slot step (a slot step of 0 or less used to freeze the schedule screen). 25 regression tests.
- **P0-2 · strict backup restore** (`e0d75e1`): `src/domain/backup.ts` checks a picked backup completely before anything is stored (structure, field types, allowed status values, duplicate IDs, references between records, real calendar dates, size limits). Restoring is now a three-step flow: inspect the file, show a restore preview, then require the typed word `복원`. A rejected backup, a full browser storage or a failed write leaves the current data untouched. Policy-only problems are repaired like P0-1 and reported in the preview. 31 regression tests (97 in total).
- **`package-lock.json`** (`e0d75e1`): the lockfile is now committed (lockfileVersion 3, npm registry only) and matches `package.json`; installs use `npm ci`.
- **CI** (`2c1f78b`): `.github/workflows/ci.yml` runs on pushes to `main` and on pull requests: `npm ci`, `typecheck`, `typecheck:domain`, `test`, `build`, `build:vite` on Node from `.nvmrc`. The workflow named as a "template" under v1.0.0 was not actually in the repository; this is the real one. No GitHub Pages workflow (deployment is Vercel).
- **Repository hygiene** (`2c1f78b`): `.gitignore` (dependencies, build output, test output, env files, logs, local Claude state), `.nvmrc` (Node 22), `.gitattributes` (LF in the repository).
- **Documentation system** (`80fa33c`, refreshed for P0-3): `PROJECT_STATE.md` (current state, known risks, next task) and `BUSINESS_MODEL.md` (the reservation business this app teaches, state transitions, real vs. simulated features). `docs/TEST_REPORT.md` now carries the current verification record and keeps the initial 41-test baseline as history. `AGENTS.md` and `CLAUDE.md` gained session and workflow rules.

### Changed
- **Project phase:** declared `02 Learning v1 Complete` (2026-09-30, user decision). The goal of this project is to learn the reservation / no-show / open-slot recovery business, not to ship a commercial service. P0-4 (CSV integrity), P0-5 (waitlist offer integrity) and D7 (pre-P0-3 contradictory data) moved to a commercial hardening backlog and are not started until the user asks. `PROJECT_STATE.md` no longer names a forced next task. Documentation only, no code change.
- `LocalRepository.replace()` validates the whole state before writing and throws without touching storage when it is invalid. The old lenient loaders in `validation.ts` stay for reading the app's own localStorage.
- Behaviour changes from P0-3 that users will notice: no-show is confirmed-only (a requested reservation used to be allowed), an arrived reservation cannot be cancelled, and an accepted waitlist offer that owes a deposit is `requested` + `unpaid` until a mock payment instead of an instantly confirmed, already-`paid` reservation.
- Test count: 41 → 66 (P0-1) → 97 (P0-2) → 118 (P0-3).

### Verified
- P0-3 (`21da4f4`): 118/118 tests; full verification on Node 22 (`npm ci`, both typechecks, tests, both builds) at the time of the change (recorded from the earlier session, not re-run on Node 22 while updating these docs); `npm test` re-run on Node 24.19.0 on 2026-09-30: 118/118.
- P0-3 browser scenarios (7, all passed; performed in the earlier session, no console errors afterwards): accepting a recovery offer gives `requested` + `unpaid`; confirming before payment is blocked; a mock payment then confirming gives `confirmed` + `paid`; a recovery reservation that needs no deposit is `confirmed` + `not_required` at once; cancelled and no-show reservations show no pay button; a requested reservation cannot be marked no-show however much time passes; an arrived reservation shows no cancel or no-show button. Blocking an arrived cancel and a requested no-show in the engine is also covered by unit tests.
- GitHub Actions `CI` run #3 on `21da4f4`: success (runs #1 on `2c1f78b` and #2 on `80fa33c` also succeeded).
- Vercel production: deployment `success` for `21da4f4`; `https://02-reservation-noshow-dashboard.vercel.app/` answers 200 and its content hash equals `HEAD:preview.html` (checked 2026-09-30).
- Earlier, on `e0d75e1`/`2c1f78b`: Node 22.23.3 and Node 24.19.0 full verification (97/97); browser restore scenarios (10): valid backup, preview, blocked until `복원` is typed, restore, invalid status, duplicate ID, missing reference, policy-only repair, reload, failed restore keeps existing data.

### Known issues (found, not fixed yet)
- **D7 (open):** reservation/deposit combinations saved before P0-3 (in localStorage or a backup) are not cleaned up and still pass load and restore validation, because P0-3 did not touch `backup.ts` or `validation.ts`. What to do with such data (repair on load, reject on restore, or warn) needs a decision; it sits in the commercial hardening backlog.
- CSV import integrity (C1–C4) and waitlist offer integrity (W1–W3) were reproduced against the engine and are listed in `PROJECT_STATE.md` (commercial hardening backlog: P0-4, P0-5).
- P1 candidates recorded in `PROJECT_STATE.md`: keep the policy/terms version in force when a reservation was created (P1-1), and split "recovered reservation value" from actual recovered revenue (P1-2).

## v1.0.0 · 2026-09-29
- Business Model 02 reservation/no-show learning dashboard created.
- Added booking conflict rules, deposits, cancellation/no-show policy, waitlist recovery flow.
- Added CSV import, local persistence, backup/restore, reports and learning scenarios.
- Added 41 domain/repository/import regression tests.
- Added GitHub CI workflow template and Vercel-ready Vite project structure.
