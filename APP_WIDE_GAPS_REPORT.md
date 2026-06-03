# FitCoach App-Wide Gaps Report

Last updated: 2026-06-03

This report is broader than the RTC-only backlog. It lists confirmed open areas across the current codebase and separates hard deployment blockers from items that can wait until beta feedback.

## Deploy-Blocking Or Pre-Beta Closures

### 1. Real RTC provider validation is still external
- `lib/rtc-provider.ts` is implemented but still relies on assumed provider endpoint and token shapes.
- Real `RTC_*` environment values are still placeholders in docs.
- Scheduled RTC, instant calling, and push click-through should not be treated as fully integrated until a real staging smoke passes.

### 2. Production media bucket/CDN verification is still open
- Media upload/storage code exists, but target deployment verification for bucket/CDN behavior and large video limits is still outstanding.
- This remains a release blocker because it affects client-sensitive uploads and movement video flows.

### 3. Repo-wide lint hardening is not fully closed
- Targeted RTC/typecheck gates are passing.
- App-wide lint debt still exists outside the narrow RTC pass and should be cleaned before a stricter release gate is claimed.

### 4. Staging/prod env completion is still external
- `RTC_*`, `VAPID_*`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, and `WS_AUTH_SECRET` still need real values.
- The repo is now ready for those values, but not self-sufficient without them.

## Can Wait Until Beta Feedback

### 1. Nutrition product depth
- Nutrition planning and meal logs exist.
- Rich calorie/macro-first nutrition logging and stronger client-facing meal analytics are still shallow compared with the rest of the platform.

### 2. Scheduling depth
- Sessions exist and now support RTC.
- A richer appointments/calendar domain with recurrence rules, conflict handling, and coach planning ergonomics is still limited.

### 3. Notification and call history polish
- Notification persistence now includes call events.
- A minimal recent-calls surface exists in messages.
- A richer archive/history experience, filters, and callback analytics can wait until usage feedback exists.

### 4. Advanced analytics and automation
- Coach digest, compliance, PR, and risk surfaces exist.
- Churn scoring, deeper AI nudges, and richer trend explanations are still not fully proven product layers.

### 5. Agency/gym operating depth
- Workspace, membership, and shared-client structures exist.
- More advanced permissions, reporting, staff workflows, and billing detail can wait until agencies are active users.

## Placeholder / Dummy / Doc-Drift Items

### 1. Environment examples are intentionally placeholder values
- `ENVIRONMENTS.md` contains example RTC and push values such as `replace-me` and example provider hosts.
- This is expected, but should not be confused with a deploy-ready environment file.

### 2. Older internal notes overstate some missing features
- `todos.txt` and `status_report.md` still contain older observations that are partially outdated.
- Example: call icons are no longer dummy; instant audio/video call flow now exists.
- Example: body tracking and intensity storage are now more complete than those older notes suggest.

### 3. RTC embedding is intentionally iframe-based for this phase
- `SessionCallScreen` and `CallInviteScreen` use provider join URLs rather than a native SDK embed.
- This is not a broken placeholder; it is an intentional first-phase integration choice.

## Current Conclusion

The repo-local work for RTC/calls, notifications, and staging preparation has moved past placeholder level. The main remaining risks are now external integration validation, real environment wiring, and broader product hardening outside the RTC slice.
