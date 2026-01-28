# tRPC Contracts — Admin Backend Editor

## Routers

- `franchise`:
  - `listAdmin` → franchises with counts of entries/milestones, supports search/sort
  - `create` → { name, accent }
  - `update` → { franchiseId, name?, accent? }
  - `delete` → { franchiseId } (blocks if entries exist; returns error listing counts)

- `entry`:
  - `listByFranchiseAdmin` → entries with mediaType, isOptional, displayOrder, completion preview, milestone counts
  - `create` → { franchiseId, title, mediaType, isOptional?, displayOrder? }
  - `update` → { entryId, title?, mediaType?, isOptional?, displayOrder? }
  - `reorder` → { franchiseId, orderedEntryIds: string[] }
  - `bulkDelete` → { entryIds: string[] } (returns affected milestone count)
  - `delete` → { entryId }

- `milestone`:
  - `treeAdmin` → { entryId } returns nested milestones
  - `create` → { entryId, parentId?, title, type, target?, description?, displayOrder? }
  - `update` → { milestoneId, title?, type?, target?, current?, description?, displayOrder? }
  - `reparent` → { milestoneId, newParentId? } (rejects cross-entry/cycles)
  - `reorder` → { parentId?, orderedIds: string[] }
  - `duplicateSubtree` → { milestoneId, newParentId? } (within same entry, resets current to defaults)
  - `delete` → { milestoneId }

- `adminAuth` (middleware concern):
  - Middleware checks `ADMIN_TOKEN` for `/admin` routes; not a tRPC procedure but governs access surface.

## Validation rules

- Franchise delete fails with entries present; response includes counts to guide cleanup.
- Entry reorder must include all entry IDs for a franchise; rejects mismatched sets.
- Milestone counter requires `target > 0`; clamps `current` in 0..target.
- Reparent rejects cycles or cross-entry moves; reorder enforces parent scope.
- Duplicate subtree resets `current` to defaults and generates new IDs while preserving structure/order.

## Performance expectations

- Listing franchises/entries should complete ≤200ms server-side for hundreds of records.
- Tree operations support ~500 milestones/entry, depth ≤5.
