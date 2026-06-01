# FitCoach Implementation TODOs

## Product Direction

- Primary customer: independent online coaches.
- Next customer: coaching agencies and gym owners that provide coaching services.
- Revenue model: SaaS subscription paid by coaches.
- Marketplace: public and searchable.
- Brand feel: accessible enough to find a good affordable coach, credible enough for premium performance coaching.
- AI role: quiet assistant for coaches; reports, risk signals, and suggested actions, not the main front-stage promise.
- Video calls: prepare for later integration with the separate RTC layer.
- Market: Turkey first; prepare locale/i18n, but keep payments and operations Turkey-first.

## P0 - Start Here

- [x] Create implementation TODO file from product decisions.
- [x] Add coach onboarding checklist to coach dashboard.
- [x] Add empty-state actions for coach dashboard, templates, clients, and profile.
- [x] Review SaaS plan copy and limits: Free, Pro, Elite, Agency.
- [x] Ensure tier gates redirect coaches to billing when limits are hit.
- [ ] Prepare a clean demo seed scenario for independent coach sales demos.
- [ ] Stabilize core E2E smoke path: auth, coach onboarding, invite, template, workout, marketplace.
- [ ] Decide and implement production media storage for avatar, transformation, meal photo, and movement video.
  - [x] Document production media storage strategy.
  - [x] Add shared media storage helper and migrate avatar uploads.
  - [x] Migrate transformation before/after uploads and deletes.
  - [ ] Migrate meal photos, body check-in photos, movement videos, and form-analysis videos.
  - [ ] Add S3/R2 driver and production env validation.

## P1 - Marketplace Trust

- [x] Add profile quality score and marketplace visibility hints for coaches.
- [ ] Make public coach profile SEO-ready with city, specialty, package, reviews, and success stories.
- [ ] Add verified review rules tied to real coach-client relationship or active subscription history.
- [ ] Add segmented marketplace filters: affordable, performance, transformation, city, online, highly rated.
- [ ] Add client coach-matching wizard: goal, budget, level, location/online preference.

## P1 - Coach SaaS Value

- [ ] Add coach action center: pending requests, risk clients, unanswered check-ins, unread messages, upcoming sessions.
- [ ] Build weekly coach digest: adherence, PRs, body logs, nutrition, risk signals, suggested actions.
- [ ] Position AI reports as Pro/Elite plan value.
- [ ] Improve revenue/subscription panel so it reflects coach SaaS subscription value clearly.

## P2 - Next Expansion

- [ ] Prepare RTC integration fields and UI: provider, roomId, callStatus, recordingUrl.
- [ ] Introduce locale/i18n structure while keeping Turkish as default.
- [ ] Design Agency/Gym tenant model: owner, coach roles, shared clients, permissions, reporting.
- [ ] Add referral growth loop for independent coaches.
