# UI Responsive Checklist

## Viewports

- `360px`
- `390px`
- `430px`
- `768px`
- `1024px`
- `>=1280px`

## Global Shell

- Header does not overlap page content
- Bottom nav does not cover CTA, composer, or form submit buttons
- Safe-area padding works on mobile
- Sidebar only appears on `md+`
- Breadcrumb stays readable on narrow widths

## Client Surfaces

- `client/dashboard`
  - KPI cards wrap without overflow
  - Hero content keeps 2-column rhythm on narrow screens
  - Workout cards keep CTA visible
  - Weekly plan row stays tappable
- `client/messages`
  - Thread list and chat panel swap cleanly on mobile
  - Composer stays above bottom nav
  - Recent calls card does not overflow
- `client/coaches`
  - Filters collapse cleanly
  - Coach cards stay one-column on mobile
- `client/profile`
  - Forms remain single-column on mobile
- `client/body-progress`
  - Progress history renders as cards on mobile
  - Before/after gallery keeps tap targets usable on narrow widths
- `client/workouts`
  - Workout history cards keep status, meta, and detail CTA readable at `360px`
- `client/workout/[assignmentId]/start`
  - Start briefing cards stack cleanly on mobile
  - Fixed bottom action bar leaves set inputs reachable above mobile nav
- `client/workouts/[workoutId]`
  - Set history renders as cards on mobile
  - Sidebar content drops below main content cleanly
- `client/nutrition/log`
  - Upload area remains usable with and without preview image
  - Macro cards stay readable without squeezing labels

## Public Marketplace

- `/coaches`
  - Search/filter form stays one-column on mobile
  - Coach cards do not force horizontal overflow
  - Public CTA from landing resolves to the marketplace instead of login
- `/coaches/[coachId]`
  - Hero CTA stack remains usable at `360px`
  - Transformation carousel does not overflow on narrow screens
  - Sidebar summary cards collapse below content cleanly

## Coach Surfaces

- `coach/dashboard`
  - KPI cards wrap to 2 columns on mobile
  - Quick links become one-column on mobile
  - Active workout stories keep horizontal scrolling without clipping
- `coach/clients`
  - Metric cards stack on mobile
  - Client action buttons stay reachable
  - Page header and broadcast CTA do not collide on narrow widths
- `coach/clients/[clientId]`
  - Sticky summary header keeps actions reachable on mobile
  - Body metrics render as cards on mobile instead of forcing horizontal table scroll
  - Progress photo modal remains usable on short viewports
- `coach/messages`
  - Same mobile rules as client messages
- `coach/templates`
  - Grid/list does not require horizontal scroll
- `coach/billing`
  - Invoice history renders as cards on mobile
  - Pricing cards keep CTA and copy readable at 360px
- `coach/team`
  - Shared client roster renders as cards on mobile
  - Workspace stats do not force horizontal compression
- `coach/clients/[clientId]`
  - Header actions stay reachable at `360px`
  - Overview/performance/body/history/video tabs do not overflow
- `coach/clients/[clientId]/progress`
  - Chart controls stay tappable on mobile
  - Analytics cards do not force horizontal scroll

## Sessions and Calls

- `SessionsPanel`
  - Provision / join CTA stack cleanly on mobile
  - Expanded content does not clip
- `SessionBookingModal`
  - Modal never exceeds viewport height
  - Form scrolls internally on short screens
- `calls/[id]` and `sessions/[id]/call`
  - Header and CTA stay visible above bottom safe area
  - Join-window locked state remains readable for both coach and client roles

## Visual Consistency

- Cards use consistent radius and border treatment
- Section headings share one hierarchy
- Primary CTA color remains orange family
- Muted surfaces use tokenized slate backgrounds
- No visible mojibake / encoding artifacts in user-facing copy

## Verification Notes

- Run `npx tsc --noEmit`
- Run targeted `eslint` on touched UI files
- Use browser screenshots for `360px`, `390px`, `430px`, `768px`, `1024px`, desktop once local server is up
- Ignore Next.js dev overlay issue badge during dev-only visual QA; validate the product layer underneath
- Public browser overflow checks were completed for `/`, `/login`, `/register?role=coach`, and `/coaches` at all listed widths
- Public browser overflow checks were also completed for `/coaches/[coachId]` at all listed widths
- Landing-page header action row overflow at `360px` was fixed in `app/page.tsx`
- Public marketplace redirect bug caused by broad `/coach` prefix matching was fixed in `proxy.ts`
- Authenticated browser checks were completed at `360`, `390`, `430`, `768`, `1024`, and desktop widths using seeded demo coach/client accounts
- Final authenticated mobile overflow fixed on `/coach/clients` via `InviteLinkGenerator`, `CoachClientsManager`, and the page grid shrink boundaries
- `npx tsc --noEmit` passes after the UI/responsive changes
