# FitCoach Demo Smoke Path

## Purpose

This path proves the product story: FitCoach is not just a workout tracker; it is an online coaching operating system plus an open coach marketplace.

## Demo Accounts

Run:

```bash
npm run db:seed:demo
```

Then sign in with:

```text
Coach: demo.coach@fitcoach.dev
Client: demo.client.aylin@fitcoach.dev
Password: 123456
```

The seed is scoped to demo emails and can be re-run.

## Coach Demo Flow

1. Sign in as `demo.coach@fitcoach.dev`.
2. Open `/coach/dashboard`.
3. Verify the first screen tells the coach what to do today:
   - onboarding checklist is visible or complete
   - active/in-progress workout appears
   - pending client request appears
   - risk signal from check-in/nutrition appears via notifications/data
   - upcoming sessions appear
   - quota/plan state is visible
4. Open `/coach/profile`.
5. Verify the marketplace value:
   - profile has slogan, bio, city, specialties, experience
   - two paid coaching packages exist
   - availability slots exist
   - transformation photo data exists
   - marketplace profile quality score is high
   - invite code/link path is visible
6. Open `/coach/templates`.
7. Verify the coach has ready-to-assign templates:
   - `12 Hafta Dönüşüm - Full Body A`
   - `Premium Performans - Üst Vücut Güç`
8. Open `/coach/clients`.
9. Verify the coach can manage the business:
   - accepted clients are visible
   - pending request from Elif is visible
   - client notes/tags exist
   - compliance signals make sense
10. Open `/coach/billing`.
11. Verify SaaS positioning:
   - Free / Pro / Elite / Agency plans are clear
   - current plan is Elite
   - limits and upgrade copy are coach-SaaS oriented

## Client Demo Flow

1. Sign in as `demo.client.aylin@fitcoach.dev`.
2. Open `/client/dashboard`.
3. Verify assigned workouts and coach relationship are visible.
4. Open `/client/coaches`.
5. Verify the open marketplace:
   - demo coach appears with avatar/profile quality/trust cues
   - packages, city, specialties, rating and transformation preview are visible
   - affordable and premium choices can coexist
6. Open coach detail page.
7. Verify public trust:
   - packages are visible
   - reviews are visible and verified purchase flags exist in data
   - transformation story is visible

## Minimum Pass Criteria

- Coach can explain the value within the first dashboard viewport.
- Coach profile can be used as a public sales page.
- Marketplace has at least two coaches with different positioning.
- A client can understand who to choose and why.
- Billing page explains why the coach pays SaaS.
- No TypeScript errors.
- Targeted lint for touched demo/smoke files has no errors.

## Known Gaps To Close Before Launch

- Production bucket/CDN settings and deployment video limits still need to be verified.
- Playwright automation is available for the core demo path:

```bash
npm run test:e2e:demo
```

The command seeds the demo data, starts the app through Playwright's web server configuration, and runs the Chromium-only market-ready smoke spec.
