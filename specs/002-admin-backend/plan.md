ios/ or android/

# Implementation Plan: Admin Backend Editor

**Branch**: `001-admin-backend` | **Date**: 2026-01-27 | **Spec**: [specs/001-admin-backend/spec.md](specs/001-admin-backend/spec.md)
**Input**: Feature specification from `/specs/001-admin-backend/spec.md`

## Summary

Add an admin backend UI within the existing Next.js App Router app to manage franchises, entries, and milestone trees with full CRUD, reorder/reparent, duplication, and bulk delete, while keeping the current T3 stack (Next.js, tRPC, Prisma/Postgres, Tailwind). Provide a minimal local-only auth gate (env-based token) to limit access during development.

## Technical Context

**Language/Version**: TypeScript on Next.js App Router, Node 18+  
**Primary Dependencies**: Next.js, React, tRPC (v11), Prisma, PostgreSQL, Tailwind CSS, React Query; minimal local auth via middleware with env token  
**Storage**: PostgreSQL via Prisma models (Franchise, Entry, Milestone)  
**Testing**: Vitest for unit (tree/validation), Playwright for admin flows, tRPC integration tests against test DB  
**Target Platform**: Web (Next.js SSR/CSR hybrid)  
**Project Type**: Single web app (T3 stack)  
**Performance Goals**: Admin interactions respond ≤1s; tree operations handle ~500 milestones/entry depth ≤5; completion recompute p95 < 200ms  
**Constraints**: Avoid cycles on reparent; block franchise delete with children; local-only auth token check in middleware  
**Scale/Scope**: Single admin at a time; hundreds of franchises/entries, up to 500 milestones per entry

## Constitution Check

No constitution rules defined; no gates to enforce. Proceed.

## Project Structure

### Documentation (this feature)

```text
specs/001-admin-backend/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md (via /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── api/trpc/[trpc]/route.ts   # tRPC handler
├── admin/                     # new admin backend routes (pages/components)
├── layout.tsx                 # wraps Providers (tRPC, Theme, Query)

src/
├── server/api/router.ts       # tRPC app router
├── server/api/routers/        # franchise, entry, milestone, preferences, completion
├── lib/completion.ts          # completion calc
├── context/theme-context.tsx  # theme and optional toggle
├── trpc/react.ts              # tRPC React client
└── components/admin/          # admin UI components (lists, tree editor)

prisma/
├── schema.prisma
└── seed.ts

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Single Next.js app with admin routes under `app/admin`, reusing existing tRPC/Prisma stack and shared components.

## Complexity Tracking

No constitution violations requiring justification.
