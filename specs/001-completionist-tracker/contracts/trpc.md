# tRPC Contracts — Completionist Progress Tracker

## Routers

- `franchise`:
  - `list` → franchises with accent color and aggregate completion (respecting optional-entry preference)
  - `create` → { name, accentColor }
  - `update` → { franchiseId, name?, accentColor? }
  - `delete` → { franchiseId }
- `entry`:
  - `listByFranchise` → entries for franchise, with completion and optional flag
  - `create` → { franchiseId, title, mediaType?, isOptional?, displayOrder? }
  - `update` → { entryId, title?, mediaType?, isOptional?, displayOrder? }
  - `delete` → { entryId }
- `milestone`:
  - `tree` → { entryId } returns nested milestones with completion percents
  - `create` → { entryId, parentId?, title, type, target?, description?, displayOrder? }
  - `update` → { milestoneId, title?, type?, target?, current?, description?, displayOrder?, parentId? }
  - `reparent` → { milestoneId, newParentId? } (validates no cycles)
  - `delete` → { milestoneId }
  - `increment` → { milestoneId, delta } (clamped 0..target; for checkboxes, toggles between 0/1)
- `preferences`:
  - `get` → returns `includeOptionalEntries`
  - `set` → { includeOptionalEntries }
- `completion`:
  - `recompute` → { entryId? } recalculates completion for entry or franchise scope via SQL recursive CTE (see below)

## Completion aggregation (database-focused)

- Input: `entryId` (or `franchiseId` resolved to entries), optional `includeOptionalEntries` flag.
- Query: Recursive CTE fetches subtree by `entryId`, computing per-node `completed`, `total`, `percent`; parents aggregate `avg(child.percent)`.
- Output: `{ milestoneId, percent, completed, total }[]` plus rolled-up `{ entryId, percent }` and `{ franchiseId, percent }` respecting optional-entry inclusion.
- Performance: Target p95 < 200ms on 500 milestones/entry, depth ≤5. Index `(entryId, parentId)` and `(entryId, displayOrder)`.

## Validation rules (contract level)

- `target` required for counter; `target > 0`.
- `current` clamped [0, target]; checkbox increments treated as toggle.
- Reparent rejects moves that introduce cycles or cross-entry moves.
- `includeOptionalEntries` stored per user; defaults to include optional entries.
