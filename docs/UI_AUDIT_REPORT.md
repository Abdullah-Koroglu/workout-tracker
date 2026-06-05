# FitCoach UI Audit

## Pages

- `app/(auth)/login`, `app/(auth)/register`, `app/(auth)/invite/[coachId]`
- `app/(client)/client/dashboard`, `coaches`, `coaches/[coachId]`, `coaches/compare`, `messages`, `profile`, `workouts`, `calendar`
- `app/(client)/client/body-progress`, `workouts/[workoutId]`, `workout/[assignmentId]/start`, `nutrition/log`
- `app/(coach)/coach/dashboard`, `clients`, `messages`, `profile`, `templates`, `billing`, `team`, `mobility`, `exercises`
- Shared call/session surfaces: `app/calls/[id]`, `app/sessions/[id]/call`

## Critical Components

- `components/shared/RoleNavShell.tsx`
- `components/ui/breadcrumb.tsx`
- `components/shared/PageHero.tsx`
- `components/shared/MessagesClient.tsx`
- `components/shared/SessionsPanel.tsx`
- `components/shared/CallInviteScreen.tsx`
- `components/shared/SessionCallScreen.tsx`
- `components/client/SessionBookingModal.tsx`
- `components/client/CoachFilterPanel.tsx`
- `components/client/BodyProgressClient.tsx`
- `components/client/ClientWorkoutFlow.tsx`
- `components/client/StartConfirmationPage.tsx`
- `components/coach/TemplateForm.tsx`
- `components/coach/TemplateAssignBoard.tsx`
- `components/coach/ExtendedProfileEditor.tsx`
- `components/coach/BillingSubscriptionPage.tsx`
- `components/coach/CoachClientsManager.tsx`
- `components/coach/ClientHub360.tsx`

## Mobile Risk Areas

- Fixed mobile bottom nav and fixed composers / CTA bars
- Dense dashboard KPI rows and horizontal card clusters
- Compare and discovery flows that previously relied on table-like layouts
- Large form surfaces in profile and template pages
- Modal bodies that can exceed short mobile viewport heights
- Billing and roster tables that were still desktop-first
- Workout and body-progress history tables that needed card fallbacks
- Client workout history cards and meal-log capture flows still needed copy cleanup and safer mobile spacing

## Visual Inconsistencies Found

- Mixed panel spacing and section-heading hierarchy across client and coach pages
- Some pages were using custom panel styling instead of shared shell tokens
- A few mobile action rows were staying inline too long before wrapping
- Some user-facing copy still contains encoding artifacts and needs a dedicated cleanup pass
- Legacy pages with embedded table sections were still forcing desktop scanning behavior on phones
- Next.js dev overlay issue badges can visually overlap the mobile nav in dev mode; this is not a product UI element

## Priority Plan

1. Normalize shell spacing, page padding, panel tokens, and mobile nav safe area
2. Fix high-traffic client and coach dashboard/profile/discovery layouts mobile-first
3. Replace mobile table patterns with card/list patterns where needed
4. Clean remaining user-visible copy issues and finish viewport QA

## Remaining High-Priority Surfaces

- `app/(client)/client/workout/[assignmentId]/start/page.tsx`
- `components/client/ClientWorkoutFlow.tsx`
- `app/(coach)/coach/mobility/page.tsx`
- `app/(coach)/coach/exercises/page.tsx`
- `app/(coach)/coach/clients/[clientId]/page.tsx`
- `app/(coach)/coach/clients/[clientId]/progress/page.tsx`
- `components/coach/ClientHub360.tsx`
- `app/calls/[id]/page.tsx`
- `app/sessions/[id]/call/page.tsx`
- `app/coaches/page.tsx`
- `app/coaches/[coachId]/page.tsx`

## Files Changed In This Pass

- `app/globals.css`
- `app/layout.tsx`
- `components/shared/RoleNavShell.tsx`
- `components/ui/breadcrumb.tsx`
- `components/shared/MessagesClient.tsx`
- `components/shared/SessionsPanel.tsx`
- `components/shared/CallInviteScreen.tsx`
- `components/shared/SessionCallScreen.tsx`
- `components/client/SessionBookingModal.tsx`
- `components/client/CoachFilterPanel.tsx`
- `app/(client)/client/dashboard/page.tsx`
- `app/(client)/client/profile/page.tsx`
- `app/(client)/client/body-progress/page.tsx`
- `app/(client)/client/coaches/content.tsx`
- `app/(client)/client/coaches/[coachId]/page.tsx`
- `app/(client)/client/coaches/[coachId]/ReviewsSection.tsx`
- `app/(client)/client/coaches/compare/CompareContent.tsx`
- `app/(client)/client/workouts/page.tsx`
- `app/(client)/client/workouts/[workoutId]/page.tsx`
- `components/client/StartConfirmationPage.tsx`
- `components/client/ClientWorkoutFlow.tsx`
- `app/(client)/client/nutrition/log/page.tsx`
- `app/(coach)/coach/dashboard/page.tsx`
- `app/(coach)/coach/clients/page.tsx`
- `app/(coach)/coach/clients/[clientId]/progress/page.tsx`
- `app/(coach)/coach/mobility/page.tsx`
- `app/(coach)/coach/exercises/page.tsx`
- `app/(coach)/coach/profile/page.tsx`
- `app/(coach)/coach/team/page.tsx`
- `components/coach/CoachClientsManager.tsx`
- `components/coach/BillingSubscriptionPage.tsx`
- `components/coach/ExtendedProfileEditor.tsx`
- `components/coach/TemplatesPageClient.tsx`
- `components/coach/TemplatesGrid.tsx`
- `components/coach/TemplateForm.tsx`
- `components/coach/TemplateAssignBoard.tsx`
- `components/coach/ClientHub360.tsx`
- `components/ui/toast-stack.tsx`
- `proxy.ts`
- `components/shared/PageHero.tsx`
- `components/shared/TransformCarousel.tsx`
- `app/coaches/[coachId]/page.tsx`

## Constraint Notes

- No backend or API logic changes
- No large architectural refactor
- Production seed safety rule remains: seed/bootstrap work must not wipe live data

## Verification Snapshot

- Public pages checked in browser against `360`, `390`, `430`, `768`, `1024`, and desktop widths:
  - `/`
  - `/login`
  - `/register?role=coach`
  - `/coaches`
  - `/coaches/[coachId]`
- A real `360px` overflow was found on the landing-page header action row and fixed in `app/page.tsx`.
- Login copy artifact cleanup was applied in `app/(auth)/login/LoginContent.tsx`.
- A route-guard bug was found in `proxy.ts`: `/coaches` was incorrectly matching the protected `/coach` prefix and redirecting to `/login`. The matcher was narrowed so the public marketplace now opens correctly.
- Public coach profile mobile overflow at `360px` was fixed through shared hero/carousel cleanup plus page root overflow containment.
- Authenticated demo accounts were seeded and verified in browser on `http://localhost:3000`:
  - Coach: `demo.coach@fitcoach.dev`
  - Client: `demo.client.aylin@fitcoach.dev`
- Authenticated browser checks were completed against `360`, `390`, `430`, `768`, `1024`, and desktop widths for these key surfaces:
  - Coach: `/coach/dashboard`, `/coach/clients`, `/coach/templates`, `/coach/profile`, `/coach/billing`, `/coach/team`, `/coach/exercises`, `/coach/mobility`, `/coach/messages`
  - Coach detail: `/coach/clients/[clientId]`, `/coach/clients/[clientId]/progress`
  - Client: `/client/dashboard`, `/client/coaches`, `/client/profile`, `/client/workouts`, `/client/workouts/[workoutId]`, `/client/workout/[assignmentId]/start`, `/client/nutrition/log`, `/client/messages`
  - Session call: `/sessions/[id]/call` for both coach and client roles
- A real mobile overflow on `/coach/clients` was fixed through responsive stacking in `components/coach/InviteLinkGenerator.tsx` and shrink-boundary fixes in `app/(coach)/coach/clients/page.tsx` plus `components/coach/CoachClientsManager.tsx`.
