# Tasks: Admin Backend Editor

**Input**: Design documents from `/specs/001-admin-backend/`
**Prerequisites**: plan.md, spec.md (required); research.md, data-model.md, contracts/ (available)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize admin-specific configuration and route shell.

- [x] T001 Add `ADMIN_TOKEN` placeholder to [.env.example](.env.example)
- [x] T002 Create admin layout shell for shared chrome at [app/admin/layout.tsx](app/admin/layout.tsx)
- [x] T003 [P] Scaffold admin landing page placeholder at [app/admin/page.tsx](app/admin/page.tsx)

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Gate admin access and provide shared admin UI scaffolding and server utilities.

- [x] T004 Implement admin middleware gating `/admin` via `ADMIN_TOKEN` at [app/middleware.ts](app/middleware.ts)
- [x] T005 [P] Add admin shell wrapper component (navigation, breadcrumbs, toasts) at [src/components/admin/AdminShell.tsx](src/components/admin/AdminShell.tsx)
- [x] T006 [P] Add milestone admin utility helpers for order/cycle validation at [src/server/api/routers/milestone-helpers.ts](src/server/api/routers/milestone-helpers.ts)

## Phase 3: User Story 1 - Manage franchises and entries (Priority: P1) — MVP

**Goal**: Admin can list, create, edit, delete, and reorder franchises/entries with required properties.
**Independent Test**: From empty state, admin creates a franchise with accent, adds an entry with media type and optional flag, edits it, reorders entries, and deletes it; all changes persist and reload correctly.

- [x] T007 [P] [US1] Implement admin franchise procedures (list with counts, create, update, delete with child-block error) at [src/server/api/routers/franchise.ts](src/server/api/routers/franchise.ts)
- [x] T008 [P] [US1] Implement admin entry procedures (list with preview/counts, create, update, delete, reorder) at [src/server/api/routers/entry.ts](src/server/api/routers/entry.ts)
- [x] T009 [P] [US1] Build franchise list/search UI with create/edit form at [src/components/admin/FranchiseList.tsx](src/components/admin/FranchiseList.tsx)
- [x] T010 [P] [US1] Build franchise page showing entry table with create/edit and reorder controls at [app/admin/franchises/[franchiseId]/page.tsx](app/admin/franchises/%5BfranchiseId%5D/page.tsx)
- [x] T011 [US1] Wire React Query/tRPC hooks with optimistic updates and error toasts for franchise/entry mutations at [src/components/admin](src/components/admin)

## Phase 4: User Story 2 - Edit milestone trees (Priority: P2)

**Goal**: Admin can edit milestone trees per entry (create, update type/targets, reorder, reparent, delete) with validation.
**Independent Test**: Admin opens an entry, reorders top-level milestones, changes a node to counter with target/current, adds a child, deletes a node; tree persists and reloads with valid completion preview.

- [x] T012 [P] [US2] Implement admin milestone procedures (treeAdmin, create, update, reparent with cycle guard, reorder, delete) at [src/server/api/routers/milestone.ts](src/server/api/routers/milestone.ts)
- [x] T013 [P] [US2] Implement subtree duplication/reset current helper in milestone router at [src/server/api/routers/milestone.ts](src/server/api/routers/milestone.ts)
- [x] T014 [P] [US2] Build milestone tree editor UI with inline editing and reorder/reparent controls at [src/components/admin/MilestoneEditor.tsx](src/components/admin/MilestoneEditor.tsx)
- [x] T015 [US2] Add entry-level admin page hosting milestone editor with data loading and mutation wiring at [app/admin/entries/[entryId]/page.tsx](app/admin/entries/%5BentryId%5D/page.tsx)

## Phase 5: User Story 3 - Safe bulk edits and navigation (Priority: P3)

**Goal**: Admin can search/filter, bulk delete entries with confirmation of affected milestones, and duplicate milestone subtrees.
**Independent Test**: Admin searches franchises, bulk-selects entries for delete with confirmation showing milestone count, confirms deletion, and duplicates a milestone subtree inside an entry; results persist after reload.

- [x] T016 [P] [US3] Add search/filter and bulk-select UI for franchises/entries at [src/components/admin/FranchiseList.tsx](src/components/admin/FranchiseList.tsx)
- [x] T017 [P] [US3] Implement entry bulk delete mutation returning affected milestone counts at [src/server/api/routers/entry.ts](src/server/api/routers/entry.ts)
- [x] T018 [P] [US3] Wire milestone subtree duplication action into editor UI at [src/components/admin/MilestoneEditor.tsx](src/components/admin/MilestoneEditor.tsx)
- [x] T019 [US3] Add confirmation modals summarizing impacted records for bulk deletes and franchise delete blocks at [src/components/admin/modals/ConfirmDeleteModal.tsx](src/components/admin/modals/ConfirmDeleteModal.tsx)

## Final Phase: Polish & Cross-Cutting

- [x] T020 [P] Add empty/loading/error states across admin lists and tree editor at [src/components/admin](src/components/admin)
- [x] T021 [P] Add accessibility (keyboard focus for reorder, ARIA on controls) at [src/components/admin](src/components/admin)
- [x] T022 Validate quickstart and admin gate docs after implementation at [specs/001-admin-backend/quickstart.md](specs/001-admin-backend/quickstart.md)

## Dependencies & Execution Order

- Setup (Phase 1) → Foundational (Phase 2) → US1 (P1) → US2 (P2) → US3 (P3) → Polish.
- US1 requires middleware and helpers from Foundational. US2 depends on US1 entry data and milestone helpers. US3 builds on US1/US2 data and UI.

## Parallel Execution Examples

- US1: T007, T008, T009 can run in parallel; T010 after T007/T008; T011 after UI + API hooks exist.
- US2: T012 and T013 in parallel; T014 after router endpoints; T015 after tree editor is ready.
- US3: T016 and T017 in parallel; T018 after US2 duplication helper; T019 after bulk delete mutation and UI selections.

## Implementation Strategy

- MVP first: Complete Setup + Foundational, then US1 to deliver franchise/entry CRUD and reorder.
- Incremental: Layer milestone editing (US2) next; then add bulk operations and search/duplication (US3).
- Keep local auth minimal (ADMIN_TOKEN) but encapsulated in middleware for easy replacement.
