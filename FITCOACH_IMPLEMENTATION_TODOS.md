# FitCoach Implementation TODOs

## Product Direction

- Primary customer: independent online coaches.
- Next customer: coaching agencies and gym owners that provide coaching services.
- Revenue model: SaaS subscription paid by coaches.
- Marketplace: public and searchable.
- Brand feel: accessible enough to find a good affordable coach, credible enough for premium performance coaching.
- AI role: quiet assistant for coaches; reports, risk signals, and suggested actions, not the main front-stage promise.
- Video calls: FitCoach-side session RTC and instant calling are implemented; real provider contract/env validation remains external.
- Market: Turkey first; prepare locale/i18n, but keep payments and operations Turkey-first.

## P0 - Start Here

- [x] Create implementation TODO file from product decisions.
- [x] Add coach onboarding checklist to coach dashboard.
- [x] Add empty-state actions for coach dashboard, templates, clients, and profile.
- [x] Review SaaS plan copy and limits: Free, Pro, Elite, Agency.
- [x] Ensure tier gates redirect coaches to billing when limits are hit.
- [x] Prepare a clean demo seed scenario for independent coach sales demos.
- [ ] Stabilize core E2E smoke path: auth, coach onboarding, invite, template, workout, marketplace.
  - [x] Add manual demo smoke path for coach and client flows.
  - [x] Automate the demo smoke path with Playwright behind `npm run test:e2e:demo`.
  - [ ] Verify the Playwright demo smoke on an environment with browsers installed.
- [ ] Decide and implement production media storage for avatar, transformation, meal photo, and movement video.
  - [x] Document production media storage strategy.
  - [x] Add shared media storage helper and migrate avatar uploads.
  - [x] Migrate transformation before/after uploads and deletes.
  - [x] Migrate meal photos, body check-in photos, movement videos, and form-analysis videos.
  - [x] Add S3/R2 driver and production env validation.
  - [x] Decide and implement protected URL policy for sensitive client media.
  - [x] Add internal deployment readiness surface and upload limit reference.
  - [ ] Configure production bucket/CDN and verify large video limits in deployment.

## P1 - Marketplace Trust

- [x] Add profile quality score and marketplace visibility hints for coaches.
- [x] Make public coach profile SEO-ready with city, specialty, package, reviews, and success stories.
- [x] Add verified review rules tied to real coach-client relationship or active subscription history.
- [x] Add segmented marketplace filters: affordable, performance, transformation, city, online, highly rated.
- [x] Add client coach-matching wizard: goal, budget, level, location/online preference.
  - [x] Surface marketplace trust score and verified review visibility on list/detail surfaces.

## P1 - Coach SaaS Value

- [x] Add coach action center: pending requests, risk clients, unanswered check-ins, unread messages, upcoming sessions.
- [x] Build weekly coach digest: adherence, PRs, body logs, nutrition, risk signals, suggested actions.
- [x] Position AI reports as Pro/Elite plan value.
- [x] Improve revenue/subscription panel so it reflects coach SaaS subscription value clearly.

## P2 - RTC / Calling

- [x] Prepare RTC session integration fields and UI: provider, roomId, callStatus, recordingUrl.
  - [x] Add RTC prep fields to session schema and session update API.
  - [x] Surface RTC provider, room ID, call status, and recording URL in shared session panel.
  - [x] Add DB migration artifact and seed coverage for new session fields.
  - [x] Expand session flow to strict roster-based audio/video join tokens and embedded call screen.
- [x] Add instant audio/video calling between accepted coach-client pairs.
  - [x] Add call invite schema, lifecycle APIs, and provider adapter hooks.
  - [x] Add app-open incoming call modal over WebSocket.
  - [x] Add web push notification path for incoming call recovery.
  - [x] Add recent calls surface in messages and persist call events into notifications.
  - [x] Add push/lifecycle handling for accepted, rejected, cancelled, ended, and missed states.
- [ ] Finish external RTC validation and deployment wiring.
  - [ ] Confirm real RTC provider contract and env values.
  - [ ] Apply latest RTC/call migrations in target environments.
  - [ ] Run multi-user staging smoke for scheduled call, instant call, third-user block, and push click-through.
- [x] Introduce locale/i18n structure while keeping Turkish as default.
  - [x] Add shared locale config, dictionaries, and localized path helpers.
  - [x] Wire landing, public marketplace, and register surfaces to the locale layer.
  - [x] Extend locale-aware copy to public coach detail and coach compare surfaces.
- [x] Design Agency/Gym tenant model: owner, coach roles, shared clients, permissions, reporting.
  - [x] Add workspace, membership, and shared-client schema models with migration artifacts.
  - [x] Seed an example team workspace for staging demos.
  - [x] Add coach-facing team workspace surface for roles, seats, shared clients, and billing readiness.
- [x] Add referral growth loop for independent coaches.

## Cross-App Gaps

- [x] Keep repo-local RTC/call backlog in sync with `RTC_CALL_INTEGRATION_GAPS_REPORT.md`.
- [ ] Close non-provider app-wide gaps that still matter before deployment.
  - [ ] Resolve remaining repo-local lint/hardening issues outside targeted RTC files.
  - [ ] Decide and implement production media bucket/CDN validation.
  - [ ] Validate remaining dummy/placeholder areas listed in the app-wide gaps report.
