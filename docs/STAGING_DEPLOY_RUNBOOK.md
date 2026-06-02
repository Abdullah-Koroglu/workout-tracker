# Staging Deploy Runbook

This runbook is the current source of truth for taking FitCoach to staging after the recent marketplace, RTC prep, and agency workspace work.

## Preconditions

- `.env.staging` exists and points to the staging PostgreSQL database.
- The target database is disposable or explicitly designated as staging.
- Docker staging profile or local Node staging flow is available.
- New migrations exist for:
  - `20260602113000_add_session_rtc_fields`
  - `20260602130000_add_agency_workspace`

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
  - RTC session preparation fields
  - an example agency/gym workspace with memberships and shared clients

## Docker Staging Deploy

Bring staging services up:

```bash
npm run staging:docker:up
```

Re-seed staging data if needed:

```bash
npm run staging:docker:seed
```

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

## Known Remaining Gaps

- Playwright browser-backed E2E verification is still pending by user choice.
- Production bucket/CDN verification for large video uploads is still open.
- Staging deploy proves migration application and seeded demo readiness, not full launch readiness.
