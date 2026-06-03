# Staging Deploy Runbook

This runbook is the current source of truth for taking FitCoach to staging after the recent marketplace, RTC, instant call, push calling, and agency workspace work.

## Preconditions

- `.env.staging` exists and points to the staging PostgreSQL database.
- The target database is disposable or explicitly designated as staging.
- Docker staging profile or local Node staging flow is available.
- New migrations exist for:
  - `20260602113000_add_session_rtc_fields`
  - `20260602130000_add_agency_workspace`
  - `20260603090000_add_fitcoach_rtc_session_flow`
  - `20260603111500_add_call_invites`

## Local Verification Before Deploy

Run these from the repo root:

```bash
npx prisma generate
npx tsc --noEmit
npx eslint "lib\\prisma.ts" "lib\\agency-workspace.ts" "app\\(coach)\\coach\\team\\page.tsx" "prisma\\seed-staging.ts"
```

## Staging Database Update

Preferred path:

```bash
npm run db:migrate:deploy:staging
npm run db:seed:staging
```

Shortcut:

```bash
npm run staging:prepare
```

Notes:

- Use `migrate deploy`, not `db push`.
- `db:seed:staging` resets and rehydrates the staging demo dataset.
- The staging seed now includes:
  - richer coach marketplace/demo data
  - RTC session flow fields
  - instant audio/video call invite data paths
  - an example agency/gym workspace with memberships and shared clients
  - call/push-ready app state assuming real `RTC_*`, `VAPID_*`, and `WS_AUTH_SECRET` env values exist

## Docker Staging Deploy

Bring staging services up:

```bash
npm run staging:docker:up
```

Automated path (used by GitHub webhook listener):

```bash
./scripts/deploy-staging.sh
```

Re-seed staging data if needed:

```bash
npm run staging:docker:seed
```

`staging_seed` now runs its own `prisma migrate deploy` before seeding, so it does not depend on a prior app container start just to create the latest tables.

If web-push calling is part of the staging pass, set:

```bash
NEXT_PUBLIC_ENABLE_SERVICE_WORKER=true
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_SUBJECT=...
WS_AUTH_SECRET=...
```

Without real values, RTC/push calling remains integration-ready but not fully validated.

The Docker entrypoints now run:

```bash
npx prisma generate
npx prisma migrate deploy
```

before the app starts.

## Post-Deploy Checks

Minimum smoke checks after staging starts:

1. Open `/`
2. Open `/coaches`
3. Log in as the seeded coach
4. Check `/coach/dashboard`
5. Check `/coach/clients`
6. Check `/coach/team`
7. Check `/coach/admin`
8. Check instant call flow from `/coach/messages` or `/client/messages`
9. If service worker + VAPID are configured, verify push notification click-through into `/calls/[id]`

## Promote To Production (Manual Only)

Production is promoted only by explicit manual command:

```bash
./scripts/promote-production.sh
```

Optional SHA guard:

```bash
./scripts/promote-production.sh <full_commit_sha>
```

For webhook listener setup and operational details, see:

- `docs/WEBHOOK_DEPLOY_AUTOMATION.md`

## Production Seed Safety Rule

- `npm run db:seed:production` must never be used as a refresh/reset tool on a live production database.
- The production seed is now guarded in code: if the target database already contains users, coach-client relations, or workouts, the seed exits with an error before any destructive statement runs.
- Allowed production use is limited to first bootstrap on an empty database.
- If production needs new baseline data after launch, use migrations or targeted backfill scripts instead of rerunning the seed.
- Full reference: `docs/PRODUCTION_SEED_SAFETY.md`

## Known Remaining Gaps

- Playwright browser-backed E2E verification is still pending by user choice.
- Production bucket/CDN verification for large video uploads is still open.
- Staging deploy proves migration application and seeded demo readiness, not full launch readiness.
