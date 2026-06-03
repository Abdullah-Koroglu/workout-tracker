# RTC / Call Integration Gaps Report

Last updated: 2026-06-03

This report captures what is still incomplete or only partially integrated after the recent RTC session flow, instant call flow, and web-push calling work.

## Current State

Implemented:
- Scheduled session RTC flow
- Strict session roster access for session calls
- Instant audio/video call invite flow
- App-open incoming call modal via WebSocket
- Web push notification path for incoming calls
- Call accept/reject/cancel/end/join lifecycle APIs
- Call event persistence into notification history
- Recent call history surface inside messages

Not yet fully closed:
- Real provider contract verification
- Staging/prod env wiring
- Full end-to-end staging/prod validation with real infra

## Can Be Closed Without User Input

These can be implemented directly in this repo without asking for more product or infrastructure decisions first.

### 1. Planning / docs sync
- Update `FITCOACH_IMPLEMENTATION_TODOS.md` to reflect actual RTC/call progress
- Update `docs/STAGING_DEPLOY_RUNBOOK.md` with new RTC and call migrations
- Extend `ENVIRONMENTS.md` with missing push/call env vars:
  - `VAPID_PUBLIC_KEY`
  - `VAPID_PRIVATE_KEY`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
  - `VAPID_SUBJECT`
  - `WS_AUTH_SECRET`

### 2. Staging push activation
- Make service worker registration staging-friendly
- Current issue: push flow is gated by `NODE_ENV === "production"` in `components/shared/PwaRegister.tsx`
- Result today: `NODE_ENV=staging` flow likely disables service worker registration and blocks push-based call testing in staging

### 3. Small RTC/call UX cleanup
- Improve button disabled/loading states
- Improve empty/error text for call states
- Unify labels between scheduled call and instant call surfaces

## Requires User Input

These need real values, external confirmation, or product decisions.

### 0. User-owned pending items summary
This is the short list of items currently blocked on direct user input or action:

- provide real RTC provider env values
- provide real push/VAPID env values
- run the new commit on the server and execute the target deploy flow
- return staging/prod smoke-test results for scheduled call, instant call, third-user block, and push notification flow
- share real provider error logs or example responses if the actual contract differs from current assumptions
- decide where call history should live and whether iframe remains acceptable for the current phase

### 1. Real RTC provider contract verification
Needs confirmation for:
- room creation endpoint and payload
- token mint endpoint and payload
- auth header / secret format
- room URL shape
- response body shape for room/token/status

Current code assumes:
- `POST /rooms`
- `POST /auth/login`
- `x-internal-secret`
- room page under `/rooms/:roomCode`

### 2. Real environment values
Need actual staging/production values for:
- `RTC_API_BASE_URL`
- `RTC_ROOM_BASE_URL`
- `RTC_SIGNALING_URL`
- `RTC_INTERNAL_API_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_SUBJECT`
- `WS_AUTH_SECRET`

### 3. Deploy/runtime strategy
Need explicit decision for:
- whether staging runs with `NODE_ENV=staging` or production build semantics
- whether service worker/push should be active in staging
- final deploy shape for WS + Next + push

### 4. Call history product placement
Need decision whether recent/missed calls should live in:
- messages page
- separate `/calls` page
- dashboard card

### 5. Long-term RTC surface direction
Need product/engineering direction for:
- iframe-based embedded room as final approach
- or future SDK-native embed with tighter in-app media controls

## Integration-Ready But Not Fully Proven

These are coded, but not yet validated end-to-end in a real deployment.

### RTC provider adapter
File: `lib/rtc-provider.ts`

Status:
- implemented
- type-safe
- not yet proven against real provider responses

### Web push calling
Files:
- `app/api/calls/start/route.ts`
- `app/api/calls/[id]/accept/route.ts`
- `app/api/calls/[id]/reject/route.ts`
- `public/sw.js`

Status:
- implemented
- depends on real VAPID config and active service worker registration
- not yet smoke-tested in staging

### Incoming call modal
File: `components/shared/IncomingCallLayer.tsx`

Status:
- implemented for app-open flow
- depends on WS connection health
- not yet verified under real multi-user staging flow

## Suggested Next Pass

If continuing without external input, the next safe implementation batch should be:

1. Update TODO/runbook/env docs
2. Enable service worker/push flow in staging
3. Keep polishing RTC/call UX and close any repo-local drift

If continuing with external input, the highest-value blocker to clear is:

1. real RTC provider envs
2. real provider contract confirmation

## Deployment Impact

Before calling the RTC/call work "fully integrated", the following must happen:

1. Apply migrations in target DB
2. Set real RTC env values
3. Set real VAPID env values
4. Verify service worker registration in target environment
5. Run multi-user smoke:
   - scheduled session call
   - instant audio call
   - instant video call
   - app-open incoming modal
   - push notification -> click -> call screen
