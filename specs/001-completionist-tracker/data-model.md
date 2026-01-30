# Data Model — Completionist Progress Tracker

## Responsive Mobile Update (2026-01-29)

> **No schema changes required.** The responsive/mobile-friendly features (FR-016 to FR-019) are purely UI/presentation layer changes. All existing entities, relations, and derived metrics remain unchanged.

## Entities

### Franchise

- Fields: `id`, `name` (unique per user), `accentColor` (preset neon value), `createdAt`, `updatedAt`.
- Relations: `entries` (1-to-many Entry), `userPreferences?` (read accent only; preferences stored per user).
- Derived: `completionPercent`, `completedMilestones`, `totalMilestones` (aggregated from entries and milestones).

### Entry

- Fields: `id`, `franchiseId`, `title`, `mediaType` (enum: game, book, movie, other), `isOptional` (bool), `displayOrder`, `createdAt`, `updatedAt`.
- Relations: `franchise` (many-to-1), `milestones` (1-to-many), `rootMilestone` (virtual root), `progress` (derived).
- Derived: `completionPercent`, `completedMilestones`, `totalMilestones`.
- Rule: Binary media entries auto-seed a single checkbox milestone representing completion; removal clears completion.

### Milestone (self-referencing)

- Fields: `id`, `entryId`, `parentId?` (self reference), `title`, `type` (enum: checkbox, counter), `target` (int, required for counter), `current` (int, default 0), `description?`, `displayOrder`, `createdAt`, `updatedAt`.
- Relations: `parent` (Milestone), `children` (Milestone[]), `entry` (Entry).
- Derived: `completionPercent` (checkbox: 0/100; counter: `min(current/target,1)`), aggregated percent from children uses average of immediate children.
- Validation: `target > 0` for counter; `current` clamped to `[0, target]`; no cycles allowed on parent.

### UserPreferences

- Fields: `id`, `userId`, `includeOptionalEntries` (bool), `createdAt`, `updatedAt`.
- Relations: `user` (future multi-user support placeholder).
- Behavior: Drives franchise completion denominator logic and is consumed by React context; persisted between sessions.

## State & Validation

- Milestone hierarchy must remain acyclic; reparenting checks against descendants.
- Deleting a milestone removes its subtree and triggers recompute for entry/franchise completion.
- Accent colors must be selected from a predefined neon palette; invalid values fall back to a safe default.
- Optional entries are included or excluded from franchise completion based on `includeOptionalEntries` preference; entry-level completion always computed regardless of optional flag.

## Derived Metrics

- `milestoneCompletionPercent`: checkbox (0% or 100%), counter (`current/target` capped at 100%), parent (`avg(childPercent)` of immediate children).
- `entryCompletionPercent`: `avg(top-level milestone percents)`.
- `franchiseCompletionPercent`: average of entry completion percents; denominator includes/excludes optional entries per preference.
