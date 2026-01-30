# Tasks: Completionist Progress Tracker

**Input**: Design documents from `/specs/001-completionist-tracker/`
**Prerequisites**: plan.md, spec.md (required); research.md, data-model.md, contracts/ (available)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline tooling.

- [x] T001 Create environment template with Postgres URL at [.env.example](.env.example)
- [x] T002 Initialize Tailwind config and global styles at [tailwind.config.ts](tailwind.config.ts) and [src/styles/globals.css](src/styles/globals.css)
- [x] T003 Add package scripts for dev/test/e2e in [package.json](package.json)
- [x] T004 [P] Configure ESLint/Prettier base rules at [.eslintrc.js](.eslintrc.js) and [.prettierrc](.prettierrc)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data, API, theming, and layout scaffolding required before user stories.

- [x] T005 Define Prisma schema with Franchise, Entry (optional flag), Milestone self-reference, UserPreferences at [prisma/schema.prisma](prisma/schema.prisma)
- [x] T006 Run initial migration and seed script for sample franchises/entries/milestones at [prisma/seed.ts](prisma/seed.ts)
- [x] T007 [P] Configure Prisma client and tRPC context at [src/server/db.ts](src/server/db.ts) and [src/server/api/trpc.ts](src/server/api/trpc.ts)
- [x] T008 [P] Create accent and preferences React context provider wiring CSS variable `--accent-neon` at [src/context/theme-context.tsx](src/context/theme-context.tsx)
- [x] T009 [P] Add completion calculation utility (checkbox/counter/parent averaging) at [src/lib/completion.ts](src/lib/completion.ts)
- [x] T010 Establish App Router layouts with persistent sidebar shell at [app/layout.tsx](app/layout.tsx)

## Phase 3: User Story 1 - Track franchise and entry progress (Priority: P1) — MVP

**Goal**: User can select franchise and entry, view overall completion and nested milestones.
**Independent Test**: With seeded data, navigating to a franchise/entry shows sidebar, carousel, completion percent, and expandable milestone tree.

### Implementation

- [x] T011 [P] [US1] Implement franchise list tRPC router and query hook at [src/server/api/routers/franchise.ts](src/server/api/routers/franchise.ts) and [src/server/api/router.ts](src/server/api/router.ts)
- [x] T012 [P] [US1] Implement entry list by franchise router and query hook at [src/server/api/routers/entry.ts](src/server/api/routers/entry.ts)
- [x] T013 [P] [US1] Render sidebar franchise list with accent selection applying theme context at [src/components/sidebar/FranchiseSidebar.tsx](src/components/sidebar/FranchiseSidebar.tsx)
- [x] T014 [P] [US1] Render entry carousel layout with active entry highlighting at [app/franchises/[franchiseId]/layout.tsx](app/franchises/%5BfranchiseId%5D/layout.tsx)
- [x] T015 [P] [US1] Fetch and render milestone tree read-only view with expand/collapse at [src/components/milestones/MilestoneTree.tsx](src/components/milestones/MilestoneTree.tsx)
- [x] T016 [US1] Compute and display entry and franchise completion summaries at [src/components/progress/CompletionSummary.tsx](src/components/progress/CompletionSummary.tsx)
- [x] T017 [US1] Wire page route to load data (franchise, entry, tree) and hydrate accent context at [app/franchises/[franchiseId]/entries/[entryId]/page.tsx](app/franchises/%5BfranchiseId%5D/entries/%5BentryId%5D/page.tsx)

### Optional Tests (add only if requested later)

- [ ] T018 [P] [US1] Playwright view test for sidebar + carousel + tree rendering at [tests/e2e/us1-view.spec.ts](tests/e2e/us1-view.spec.ts)

## Phase 4: User Story 2 - Update milestone progress (Priority: P2)

**Goal**: User marks checkboxes or increments counters; progress recalculates instantly across hierarchy and franchise.
**Independent Test**: Toggling a checkbox or reaching a counter target updates milestone, entry, and franchise percentages within ~1s.

### Implementation

- [x] T019 [P] [US2] Add milestone increment/toggle mutation in tRPC router at [src/server/api/routers/milestone.ts](src/server/api/routers/milestone.ts)
- [x] T020 [P] [US2] Implement completion recompute procedure using Postgres recursive CTE at [src/server/api/routers/completion.ts](src/server/api/routers/completion.ts)
- [x] T021 [US2] Connect milestone tree UI to mutations with optimistic updates and rollback on error at [src/components/milestones/MilestoneTree.tsx](src/components/milestones/MilestoneTree.tsx)
- [x] T022 [US2] Update completion summary UI to refetch/recompute after mutations at [src/components/progress/CompletionSummary.tsx](src/components/progress/CompletionSummary.tsx)

### Optional Tests (add only if requested later)

- [ ] T023 [P] [US2] Integration test for counter/checkbox mutations and rollup at [tests/integration/us2-completion.test.ts](tests/integration/us2-completion.test.ts)

## Phase 5: User Story 3 - Configure structure and identity (Priority: P3)

**Goal**: User can create/edit franchises and entries (including optional flag, accent color) and toggle optional-entry inclusion in profile settings.
**Independent Test**: From empty state, user adds a franchise with accent, an entry (optionally marked optional), nested milestones, and sees accent applied; profile toggle switches inclusion mode and recomputes completion.

### Implementation

- [x] T024 [P] [US3] Add tRPC mutations for create/update/delete franchise and entry (including optional flag, accent color) at [src/server/api/routers/franchise.ts](src/server/api/routers/franchise.ts) and [src/server/api/routers/entry.ts](src/server/api/routers/entry.ts)
- [x] T025 [P] [US3] Implement profile/preferences router get/set for `includeOptionalEntries` at [src/server/api/routers/preferences.ts](src/server/api/routers/preferences.ts)
- [x] T026 [P] [US3] Build franchise/entry editor UI (forms, validation, accent picker, optional toggle) at [src/components/forms/FranchiseEntryForm.tsx](src/components/forms/FranchiseEntryForm.tsx)
- [x] T027 [US3] Implement profile/settings page with inclusion toggle and immediate recompute trigger at [app/profile/page.tsx](app/profile/page.tsx)
- [x] T028 [US3] Add binary-media auto-checkbox seeding when creating book/movie entries in entry creation flow at [src/server/api/routers/entry.ts](src/server/api/routers/entry.ts)

### Optional Tests (add only if requested later)

- [ ] T029 [P] [US3] Playwright flow: create franchise, entry, milestones, toggle optional inclusion at [tests/e2e/us3-config.spec.ts](tests/e2e/us3-config.spec.ts)

## Final Phase: Polish & Cross-Cutting

- [x] T030 [P] Add empty/loading/error states for sidebar, carousel, and milestone tree at [src/components](src/components)
- [x] T031 [P] Add accessibility pass (ARIA labels for navigation, keyboard expand/collapse) at [src/components](src/components)
- [x] T032 Optimize milestone queries with indexes and select pruning at [prisma/schema.prisma](prisma/schema.prisma)
- [x] T033 [P] Validate quickstart by running migrations, seeds, and smoke e2e at [quickstart.md](specs/001-completionist-tracker/quickstart.md)

---

## Phase 6: User Story 4 - Use the app on mobile devices (Priority: P2)

**Goal**: User accesses the tracker on mobile and navigates franchises, entries, milestones with a responsive interface that adapts to smaller screens (<768px).

**Independent Test**: On a mobile viewport, user can tap hamburger → select franchise → swipe carousel → expand milestones without horizontal scrolling or misclicks.

### Implementation

- [x] T034 [P] [US4] Add `.touch-target` and scroll-snap utilities to [src/styles/globals.css](src/styles/globals.css)
- [x] T035 [P] [US4] Create `useMediaQuery` hook with SSR-safe detection at [src/hooks/useMediaQuery.ts](src/hooks/useMediaQuery.ts)
- [x] T036 [P] [US4] Create `MobileMenuContext` provider with open/close/toggle state at [src/context/mobile-menu-context.tsx](src/context/mobile-menu-context.tsx)
- [x] T037 [US4] Create `MobileMenu` component with hamburger button, backdrop, and slide-in panel at [src/components/layout/MobileMenu.tsx](src/components/layout/MobileMenu.tsx)
- [x] T038 [US4] Wrap app with `MobileMenuProvider` in root layout at [app/providers.tsx](app/providers.tsx)
- [x] T039 [US4] Modify `FranchiseSidebar` to hide on mobile (`hidden md:flex`) and render inside `MobileMenu` overlay at [src/components/sidebar/FranchiseSidebar.tsx](src/components/sidebar/FranchiseSidebar.tsx)
- [x] T040 [US4] Add responsive carousel layout with scroll-snap and full-width items on mobile at [app/franchises/[franchiseId]/layout.tsx](app/franchises/%5BfranchiseId%5D/layout.tsx)
- [x] T041 [US4] Update `MilestoneTree` with touch-target sizing (44×44px) and scaled indentation (16px mobile, 24px desktop) at [src/components/milestones/MilestoneTree.tsx](src/components/milestones/MilestoneTree.tsx)
- [x] T042 [US4] Ensure hamburger icon stays fixed during scroll and close menu on route change at [src/components/layout/MobileMenu.tsx](src/components/layout/MobileMenu.tsx)

### Optional Tests (add only if requested later)

- [ ] T043 [P] [US4] Vitest unit test for `useMediaQuery` hook at [tests/unit/useMediaQuery.test.ts](tests/unit/useMediaQuery.test.ts)
- [ ] T044 [P] [US4] Playwright mobile viewport test for hamburger menu, carousel swipe, and milestone tree at [tests/e2e/mobile-navigation.spec.ts](tests/e2e/mobile-navigation.spec.ts)

---

## Phase 7: Final Polish (Post-Mobile)

- [ ] T045 [P] Verify no horizontal scroll on 320px viewport across all pages
- [ ] T046 [P] Add touch gesture conflict prevention (swipe vs tap) documentation at [specs/001-completionist-tracker/quickstart.md](specs/001-completionist-tracker/quickstart.md)
- [ ] T047 Run full e2e suite on mobile-chrome and mobile-safari Playwright projects

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → User Stories in priority order (US1 → US2 → US3 → US4) → Polish.
- US2 depends on completion calc and milestone tree from US1.
- US3 depends on data model, routers, and UI shell from US1, and recompute pipeline from US2.
- US4 depends on UI components from US1 (sidebar, carousel, milestone tree) to add responsive behavior.

## Parallel Execution Examples

- US1: T011, T012, T013, T014, T015 can proceed in parallel; T016/T017 after data + UI wiring.
- US2: T019 and T020 in parallel; T021 follows mutation wiring; T022 after recompute hook.
- US3: T024–T026 parallel; T027 after preferences router; T028 with T024.
- US4: T034, T035, T036 in parallel (utilities + context); T037–T039 sequentially (MobileMenu depends on context); T040–T041 in parallel after menu wiring.

## Implementation Strategy

- MVP first: Complete Setup + Foundational, then US1; demo read-only progress with accent theming.
- Incremental: Layer US2 mutations and recompute; then US3 creation/preferences and accent updates.
- Mobile: US4 adds responsive behavior on top of existing UI; can be developed after US1 UI is stable.
- Testing: Optional e2e/integration tasks provided; add if test scope is requested.
