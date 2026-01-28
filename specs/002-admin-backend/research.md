# Research Notes — Admin Backend Editor

## Decisions

- **Local auth gate**: Use a minimal shared admin token via environment variable checked in Next.js middleware for `/admin` routes; defaults to disabled when `ADMIN_TOKEN` is empty. Rationale: keeps local/protected access without full user system; easy to remove/replace later.
- **Franchise deletion rule**: Block deletion when entries/milestones exist; require admin to delete children first. Rationale: prevents accidental cascades and aligns with spec.
- **Milestone tree operations**: Reparent only within the same entry; detect cycles by checking ancestry before update; use ordered `displayOrder` integers with gaps to simplify reorder.
- **Duplication behavior**: Duplicate milestone subtree within same entry, generating new IDs, copying structure, resetting `current` to defaults, preserving titles/targets/order.
- **Bulk delete confirmation**: For entry bulk delete, precompute affected milestone counts and show in confirmation modal; apply delete in a single tRPC mutation inside a transaction.
- **Validation**: Enforce `target > 0` for counters; clamp `current` between 0 and target; reject cross-entry moves; ensure displayOrder uniqueness per parent.

## Alternatives Considered

- **Auth**: Considered no auth (pure local) vs. basic auth header. Chose env token check for minimal friction and clearer intent. Basic auth possible later.
- **Reorder storage**: Considered floating-point positions; kept integer `displayOrder` with renormalization to avoid precision drift.
- **Duplication scope**: Considered cross-entry duplication; kept in-entry only to avoid accidental cross-franchise copying and keep confirmations simpler.
