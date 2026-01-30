# Research Notes — Completionist Progress Tracker

## 1) Milestone modeling and traversal

- **Decision**: Use adjacency-list self-reference (`Milestone { id, parentId? }`) with Postgres recursive CTEs; index `(entryId, parentId)` for fast subtree fetches.
- **Rationale**: Prisma supports self-relations cleanly; recursive CTEs are native in Postgres and performant for the target depth (≤5 levels) and volume (~500 milestones/entry).
- **Alternatives considered**: Closure table (more writes, denormalized edges) and nested sets (complex updates on reparenting). Rejected due to higher write complexity and lower fit for frequent reparent/reorder operations.

## 2) Completion rollup procedure

- **Decision**: Implement a tRPC procedure that delegates to a Postgres recursive CTE to aggregate `completed/total` and percentage per node, then maps to entry and franchise totals; cache within request and avoid client-side recompute.
- **Rationale**: Keeps heavy traversal in the DB, reducing app memory and round-trips; ensures deterministic rollup for checkbox + counter milestones; meets ≤1s perceived update when paired with optimistic UI.
- **Alternatives considered**: Client-side DFS over fetched tree (more data transfer, slower on large trees) and background materialized views (adds complexity and staleness risks). Rejected for simplicity and real-time accuracy needs.

## 3) Accent theming and optional-entry preference

- **Decision**: Store accent color per franchise and user preference for optional-entry inclusion in a `UserPreferences` record; expose React context to set CSS variable `--accent-neon` and recompute completion based on the toggle.
- **Rationale**: Centralizes theming and preference in one provider; Tailwind can consume CSS variable for glows/progress; toggle changes can trigger a single refetch/recalc for franchise completion.
- **Alternatives considered**: Inline Tailwind classes per component (harder to swap neon palettes) and per-page local state (inconsistent across layouts). Rejected to ensure global consistency.

## 4) Responsive sidebar (collapsible hamburger menu)

- **Decision**: Use Tailwind's `md:` breakpoint (768px) to toggle sidebar visibility; create a React context (`MobileMenuContext`) to manage open/close state; render sidebar content inside a slide-in overlay on mobile using CSS `transform: translateX()` with `transition-transform duration-300`.
- **Rationale**: Tailwind breakpoints are already in use; CSS transitions provide smooth 300ms animation without JS animation libraries; React context allows any component (hamburger button, backdrop, sidebar) to toggle state.
- **Alternatives considered**: 
  - Headless UI `<Dialog>` for overlay (adds dependency, more complexity for simple use case)
  - CSS-only `:target` or checkbox hack (less accessible, harder to integrate with React state)
  - Framer Motion (overkill for translate animation)
- Rejected in favor of native CSS transitions + React context for minimal bundle impact.

## 5) Touch-friendly carousel on mobile

- **Decision**: Use native CSS `overflow-x: auto` with `scroll-snap-type: x mandatory` for touch swipe support; remove spacer elements on mobile via conditional rendering; ensure carousel items are full-width minus padding on screens <768px.
- **Rationale**: Native scroll-snap is performant and works on iOS/Android without JS; no external carousel library needed; touch gestures handled by browser.
- **Alternatives considered**:
  - Embla Carousel / Swiper.js (external dependency, more bundle size)
  - Custom touch handlers with `touchstart`/`touchmove` (complex, reinventing browser scroll)
- Rejected to keep bundle lean and leverage native browser capabilities.

## 6) Touch targets and milestone tree scaling

- **Decision**: Add Tailwind utility class `.touch-target` with `min-h-[44px] min-w-[44px]`; apply to all interactive elements (checkboxes, counters, expand/collapse buttons); reduce indentation per level from 24px to 16px on mobile via `md:pl-6 pl-4` pattern.
- **Rationale**: 44×44px is Apple HIG / Google Material minimum for touch targets; scaled indentation prevents overflow on narrow screens while maintaining hierarchy visibility.
- **Alternatives considered**:
  - Inline styles per element (repetitive, harder to maintain)
  - CSS custom property for indent (adds runtime overhead for simple static value)
- Rejected for simplicity; Tailwind responsive classes are sufficient.

## 7) Mobile-first vs desktop-first approach

- **Decision**: Adopt mobile-first for new responsive code; base styles target mobile, then use `md:` and `lg:` prefixes for tablet/desktop overrides.
- **Rationale**: Tailwind defaults to mobile-first; ensures mobile experience is never an afterthought; reduces CSS specificity issues.
- **Alternatives considered**: Desktop-first with `max-width` media queries (goes against Tailwind conventions, leads to more overrides).
- Rejected to align with Tailwind best practices.

## 8) Fixed hamburger icon during scroll

- **Decision**: Position hamburger button with `fixed top-4 left-4 z-50` on mobile; ensure it remains accessible when carousel or milestone tree is scrolled.
- **Rationale**: Fixed positioning keeps navigation always accessible; high z-index prevents overlap issues with other UI elements.
- **Alternatives considered**: Sticky header bar (takes vertical space, adds complexity with existing header).
- Rejected for cleaner minimal UI aligned with Wii-inspired aesthetic.

