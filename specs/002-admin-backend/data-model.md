# Data Model — Admin Backend Editor

## Entities

### Franchise

- Fields: `id`, `name`, `accent`, `createdAt`, `updatedAt`.
- Relations: `entries` (1-to-many Entry).
- Rules: Cannot be deleted if it has entries/milestones; requires prior child cleanup.

### Entry

- Fields: `id`, `franchiseId`, `title`, `mediaType` (enum), `isOptional` (bool), `displayOrder`, `createdAt`, `updatedAt`.
- Relations: `franchise` (many-to-1), `milestones` (1-to-many).
- Rules: Display order maintained per franchise; supports bulk delete; optional flag and mediaType editable.

### Milestone (self-referencing)

- Fields: `id`, `entryId`, `parentId?`, `title`, `type` (checkbox/counter), `target?`, `current`, `description?`, `displayOrder`, `createdAt`, `updatedAt`.
- Relations: `parent`, `children`, `entry`.
- Rules: `target > 0` for counters; `current` clamped 0..target; reparent only within same entry; cycles rejected; duplication resets `current` to defaults.

### Admin Access (local-only gate)

- Configuration: `ADMIN_TOKEN` env value checked by middleware on `/admin` routes; empty token disables auth (local-only assumed secure network).
- Behavior: Requests missing/invalid token get blocked with 401 for admin routes; non-admin routes unaffected.
