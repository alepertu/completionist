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
