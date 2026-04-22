# Design System Strategy: Kinetic Precision

## 1. Overview & Creative North Star

### The Creative North Star: "The Elite Performance Lab"
This design system moves beyond the standard fitness app aesthetic of generic "gym motivation" and enters the realm of high-end, editorial performance engineering. We are creating a digital environment that feels like a precision instrument—authoritative, sleek, and relentlessly focused on data-driven results.

To break the "template" look, we leverage **Kinetic Precision**. This is achieved through intentional asymmetry—such as oversized display typography paired with compact, high-density data visualizations—and the use of overlapping "shards" of content that mimic the dynamic movement found in the brand's logo. By utilizing deep tonal shifts and glassmorphism rather than rigid borders, the UI feels breathable yet grounded, echoing the balance of an elite athlete in motion.

---

## 2. Colors

The palette is a high-contrast interplay between the stability of deep navy and the explosive energy of vibrant orange.

*   **Primary (`#9d4300`) & Primary Container (`#f97316`):** These are our "Energy Tokens." They should be used sparingly for high-impact calls to action and to highlight active performance metrics.
*   **Secondary (`#455f88`) & Tertiary (`#0053db`):** These represent the "Precision Tokens." They provide the professional, trustworthy foundation of the brand, used for secondary navigation and structural anchors.
*   **Neutral Surfaces (`#f7f9fb` to `#ffffff`):** The stage upon which the kinetic elements perform.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Boundaries must be defined through background color shifts. For example, a workout summary card (`surface-container-low`) should sit on a main background (`surface`) without a stroke. The contrast in tone alone must provide the definition.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create nested depth:
1.  **Base Layer:** `surface` (Main app background).
2.  **Structural Sections:** `surface-container-low` (Large content areas).
3.  **Active Elements:** `surface-container-highest` (Individual cards or interactive modules).

### The "Glass & Gradient" Rule
To elevate the "Kinetic" aspect, floating elements (like quick-action menus or modal overlays) should utilize **Glassmorphism**. Apply `surface-container-lowest` with 80% opacity and a `backdrop-blur` of 12px. For Hero backgrounds or primary action buttons, use a subtle diagonal gradient transitioning from `primary` to `primary-container` to add "soul" and a sense of forward momentum.

---

## 3. Typography

**Lexend** is the sole typeface for this system. Its geometric clarity provides the "Precision," while the bold weights provide the "Kinetic" energy.

*   **Display (Large/Medium):** Reserved for high-editorial moments—like daily goal streaks or category headers. Use these to anchor the page with an authoritative, bold presence.
*   **Headline & Title:** These are the functional anchors. They must be bold to maintain the professional, athletic feel.
*   **Body (Large/Medium):** Optimized for readability in high-stress environments (e.g., mid-workout). Ensure generous line-height to maintain an "Editorial" feel.
*   **Label (Small):** Used for technical data points and micro-copy. These should be uppercase with slightly increased letter-spacing to mimic the look of performance apparel branding.

---

## 4. Elevation & Depth

We eschew traditional drop shadows in favor of **Tonal Layering**. 

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` background creates a soft, natural lift that feels integrated into the architecture rather than "pasted on."
*   **Ambient Shadows:** If an element must float (e.g., a FAB or a critical alert), use a highly diffused shadow: `blur: 24px`, `opacity: 6%`, and color-tinted with `on-surface`. This mimics natural ambient light in a premium studio.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` token at **15% opacity**. This creates a "Ghost Border" that suggests a boundary without introducing visual clutter.
*   **Glassmorphism & Depth:** Use semi-transparent layers to allow the vibrant `tertiary` or `primary` accents to bleed through from the background, creating a sophisticated, multi-dimensional workspace.

---

## 5. Components

### Buttons
*   **Primary:** Gradient fill (`primary` to `primary-container`), Lexend Bold, `ROUND_FOUR` (0.25rem).
*   **Secondary:** `surface-container-high` background with `on-secondary-container` text. No border.
*   **Tertiary:** Ghost style; `on-surface` text with a subtle `primary` underline on hover.

### Cards & Lists
*   **No Dividers:** Forbid the use of divider lines. Separate list items using a 4px or 8px vertical gap (from the spacing scale) and subtle background shifts (alternating `surface` and `surface-container-low`).
*   **Kinetic Cards:** Use `ROUND_FOUR` rounding. Hero cards should feature a subtle 2% rotation or an asymmetrical padding layout to break the grid.

### Input Fields
*   **Stateful Design:** Use `surface-container-highest` for the field background. The active state is signaled by a 2px `primary` (orange) bottom-bar, rather than a full-box stroke. This maintains the "clean, high-performance" look.

### Chips
*   **Performance Chips:** Used for workout tags or muscle groups. Use `secondary-container` with `on-secondary-container` text. Keep rounding at `full` for these specific elements to distinguish them from the "Precision" (square-ish) buttons.

---

## 6. Do’s and Don'ts

### Do
*   **Do** use white space as a structural element. Editorial design requires "breathing room" to feel premium.
*   **Do** align text-heavy content to a strict grid while allowing decorative "kinetic" elements (like the star from the logo) to bleed off the edge of the screen.
*   **Do** ensure high contrast for all performance metrics using `display-sm` or `headline-lg` typography.

### Don't
*   **Don't** use 100% black shadows. It kills the "clean" athletic aesthetic. Use tinted navy-greys.
*   **Don't** use sharp 90-degree corners. Stick to the `ROUND_FOUR` (0.25rem) scale to maintain the "Precision" without feeling aggressive.
*   **Don't** use standard dividers or lines to separate content. Let the colors and typography do the heavy lifting.
*   **Don't** overcrowd the screen. If a page feels "busy," increase the vertical spacing between containers rather than adding borders.