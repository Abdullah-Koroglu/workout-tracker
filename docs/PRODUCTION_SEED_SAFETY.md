# Production Seed Safety

This rule is mandatory for FitCoach production environments.

## Rule

- `npm run db:seed:production` is bootstrap-only.
- It must never be used to refresh, reset, or repopulate a live production database.
- If the production database already contains live data, the seed must stop before any destructive statement runs.

## Current Enforcement

The production seed script in [C:\Users\abdullahkoroglu\Documents\sources\DIS\workout-tracker\prisma\seed.ts](C:\Users\abdullahkoroglu\Documents\sources\DIS\workout-tracker\prisma\seed.ts) now performs a safety check when `NODE_ENV=production`.

It aborts if the target database already contains any of these records:

- `User`
- `CoachClientRelation`
- `Workout`

If any of those tables are non-empty, the script exits with an error before the destructive `deleteMany()` calls run.

## Allowed Use

- First bootstrap of an empty production database

## Not Allowed

- Re-seeding a live production environment
- Refreshing production demo data
- Using production seed as a migration substitute

## If Production Needs New Baseline Data

Use one of these instead:

- Prisma migrations
- Targeted backfill scripts
- One-off admin scripts with explicit scope

Do not solve live data changes by rerunning the production seed.
