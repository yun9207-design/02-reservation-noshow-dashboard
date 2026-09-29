# Changelog

## Unreleased · after v1.0.0 (main @ `2c1f78b`, 2026-09-29)

### Added
- **P0-1 · policy value validation** (`529dcf1`): one definition of usable values for slot minutes, opening/closing hour, cancellation hours, no-show grace and offer hold (`src/domain/policy.ts`). `updatePolicy` and the Policies screen reject bad values; localStorage loading and backup restore replace unusable numbers with defaults and write an audit entry; `candidateSlots` can no longer loop forever on a bad slot step (a slot step of 0 or less used to freeze the schedule screen). 25 regression tests.
- **P0-2 · strict backup restore** (`e0d75e1`): `src/domain/backup.ts` checks a picked backup completely before anything is stored (structure, field types, allowed status values, duplicate IDs, references between records, real calendar dates, size limits). Restoring is now a three-step flow: inspect the file, show a restore preview, then require the typed word `복원`. A rejected backup, a full browser storage or a failed write leaves the current data untouched. Policy-only problems are repaired like P0-1 and reported in the preview. 31 regression tests (97 in total).
- **`package-lock.json`** (`e0d75e1`): the lockfile is now committed (lockfileVersion 3, npm registry only) and matches `package.json`; installs use `npm ci`.
- **CI** (`2c1f78b`): `.github/workflows/ci.yml` runs on pushes to `main` and on pull requests: `npm ci`, `typecheck`, `typecheck:domain`, `test`, `build`, `build:vite` on Node from `.nvmrc`. The workflow named as a "template" under v1.0.0 was not actually in the repository; this is the real one. No GitHub Pages workflow (deployment is Vercel).
- **Repository hygiene** (`2c1f78b`): `.gitignore` (dependencies, build output, test output, env files, logs, local Claude state), `.nvmrc` (Node 22), `.gitattributes` (LF in the repository).
- **Documentation system**: `PROJECT_STATE.md` (current state, known risks, next task) and `BUSINESS_MODEL.md` (the reservation business this app teaches, state transitions, real vs. simulated features). `docs/TEST_REPORT.md` now carries the current verification record and keeps the initial 41-test baseline as history. `AGENTS.md` and `CLAUDE.md` gained session and workflow rules.

### Changed
- `LocalRepository.replace()` validates the whole state before writing and throws without touching storage when it is invalid. The old lenient loaders in `validation.ts` stay for reading the app's own localStorage.
- Test count: 41 → 66 (P0-1) → 97 (P0-2).

### Verified
- Full verification on Node 22.23.3 (`npm ci`, both typechecks, 97/97 tests, both builds) and on Node 24.19.0.
- Browser restore scenarios (10): valid backup, preview, blocked until `복원` is typed, restore, invalid status, duplicate ID, missing reference, policy-only repair, reload, failed restore keeps existing data.
- GitHub Actions `CI` run #1 on `2c1f78b`: success.
- Vercel production: deployment `success`; `https://02-reservation-noshow-dashboard.vercel.app/` serves content byte-identical to the committed `preview.html`.

### Known issues (found, not fixed yet)
- Deposit state integrity, CSV import integrity and waitlist offer integrity gaps were reproduced against the current engine and are listed in `PROJECT_STATE.md` (P0-3 → P0-5).

## v1.0.0 · 2026-09-29
- Business Model 02 reservation/no-show learning dashboard created.
- Added booking conflict rules, deposits, cancellation/no-show policy, waitlist recovery flow.
- Added CSV import, local persistence, backup/restore, reports and learning scenarios.
- Added 41 domain/repository/import regression tests.
- Added GitHub CI workflow template and Vercel-ready Vite project structure.
