# Implementation Plan: Completionist Progress Tracker

**Branch**: 001-completionist-tracker | **Date**: 2026-01-26 | **Spec**: [specs/001-completionist-tracker/spec.md](specs/001-completionist-tracker/spec.md)
**Input**: Feature specification from `/specs/001-completionist-tracker/spec.md`

## Summary

Build a Wii-inspired completion tracker using the T3 stack (Next.js App Router, TypeScript, tRPC, Prisma, PostgreSQL, Tailwind). Key behaviors: infinite-nesting milestones via self-referencing Prisma model, optional/recommended entry handling via user toggle, binary media entries auto-seeded with a single checkbox milestone, and franchise accent colors propagated through CSS variables and React context. Completion percentages must recalc within ~1s after milestone or preference changes.

## Technical Context

**Language/Version**: TypeScript targeting Next.js App Router on Node 18+  
**Primary Dependencies**: Next.js (App Router), tRPC, Prisma, PostgreSQL, Tailwind CSS, React Context for theme/accent state  
**Storage**: PostgreSQL via Prisma; self-referencing `Milestone` model to support infinite nesting  
**Testing**: Vitest for units (calc utilities), Playwright for UI flows (sidebar + carousel + milestone updates), tRPC procedure tests with a test Postgres db  
**Target Platform**: Web (Next.js SSR/ISR with client interactivity)  
**Project Type**: Single web app (T3 stack)  
**Performance Goals**: UI updates perceived ≤1s after milestone or preference change; tRPC completion procedure p95 < 200ms for 500 milestones/5 levels  
**Constraints**: Handle at least 500 milestones per entry and 5+ levels of nesting; accent updates must repaint UI without page reload; optional-entry toggle must be global and persisted  
**Scale/Scope**: Single-user context; a few hundred franchises/entries expected per user

## Constitution Check

Constitution file is not populated; no enforced gates discovered. Proceeding with plan; governance to be updated once constitution is defined.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── layout.tsx             # global layout with sidebar persistence
├── franchises/            # routes for franchise-level pages
└── entries/[entryId]/     # nested layout for entry carousel context

src/
├── components/            # UI components (sidebar, carousel, milestone tree, progress bars)
├── styles/                # Tailwind + CSS variable helpers
├── server/
│   ├── api/
│   │   ├── trpc.ts        # tRPC router setup
│   │   └── routers/       # feature routers (milestones, franchises, entries, preferences)
│   └── db.ts              # Prisma client
├── lib/                   # shared utilities (completion calc, accent resolver)
└── context/               # React context for accent and optional-entry preference

prisma/
└── schema.prisma          # self-referencing Milestone model, related entities

tests/
├── unit/                  # calc utilities, accent variable helpers
├── integration/           # tRPC procedures against test DB
└── e2e/                   # Playwright flows (sidebar, carousel, milestone updates, preference toggle)
```

**Structure Decision**: Single Next.js (T3) web app with Prisma/tRPC; no separate backend package.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Phase 0: Research Plan

- Self-referencing milestone modeling: choose adjacency list in Prisma with recursive CTEs in Postgres; index parent/entry for traversal.
- Completion rollup: design tRPC procedure backed by SQL recursive aggregation to compute completion for milestones/entries/franchises; ensure 1s perceived update.
- Accent theming: establish CSS variable `--accent-neon` via React context, and Tailwind utilities consuming the variable.

## Phase 1: Design & Contracts Plan

- Data model: finalize Prisma schema (Franchise, Entry with optional flag, Milestone self-reference, UserPreferences for optional toggle and accent palette choice).
- Contracts: tRPC router surface for franchises, entries, milestones, preferences; include completion computation endpoint optimized for Postgres recursive queries.
- Quickstart: add steps for install, env, Prisma migrate, seed sample franchises/entries/milestones, dev server.

## Post-Design Constitution Check

Will re-evaluate gates after Phase 1 once constitution content is available.
