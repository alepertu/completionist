# Feature Specification: Admin Backend Editor

**Feature Branch**: `001-admin-backend`  
**Created**: 2026-01-27  
**Status**: Draft  
**Input**: User description: "In my app, I want to be able to edit the database from a comprehensive \"backend\" where I see franchises, entries and milestones listed and I can configure their properties."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Manage franchises and entries (Priority: P1)

Admin can view all franchises, drill into entries, and create/edit/delete them with required properties (names, accent, media type, optional flag, display order).

**Why this priority**: Core value is controlling top-level catalog data; without this, the backend cannot modify what end users see.

**Independent Test**: From an empty state, an admin creates a franchise with accent, adds an entry with media type and optional flag, edits it, and deletes it; changes persist and show in the lists without touching milestones.

**Acceptance Scenarios**:

1. **Given** an empty catalog, **When** the admin creates a franchise with name and accent, **Then** it appears in the list with persisted values.
2. **Given** a franchise, **When** the admin adds an entry with media type, optional flag, and display order, **Then** it appears under that franchise in the correct order and remains after refresh.

---

### User Story 2 - Edit milestone trees (Priority: P2)

Admin can view and edit an entry's milestones as a tree: create, rename, change type (checkbox/counter), set targets and current values, reorder, reparent, and delete nodes with validation preventing cycles.

**Why this priority**: Milestones drive completion logic; admins must adjust them to reflect real progress structures.

**Independent Test**: With an existing entry, the admin reorders top-level milestones, converts one to a counter with target/current values, adds a child milestone, and deletes another; the tree updates and persists with valid completion rollups.

**Acceptance Scenarios**:

1. **Given** an entry with milestones, **When** the admin reorders and reparents nodes, **Then** the tree saves without cycles and displays the new hierarchy after reload.
2. **Given** a milestone switched to counter, **When** the admin sets target and current within bounds, **Then** the node shows the updated values and completion preview recalculates.

---

### User Story 3 - Safe bulk edits and navigation (Priority: P3)

Admin can quickly find and adjust items via search/filter, perform bulk deletes or duplicate templates, and see a confirmation/summary of impacted records before applying changes.

**Why this priority**: Large catalogs need efficient maintenance and guardrails to avoid accidental destructive changes.

**Independent Test**: Admin searches for a franchise, selects multiple entries for deletion, sees the count of affected milestones, confirms, and the removals persist; another test duplicates a milestone subtree as a template into the same entry.

**Acceptance Scenarios**:

1. **Given** multiple entries match a search, **When** the admin selects and bulk deletes them, **Then** a confirmation shows affected milestones and the deletion applies only after confirmation.
2. **Given** a milestone subtree, **When** the admin duplicates it into the same entry, **Then** the copy appears with a unique name and independent target/current values.

---

### Edge Cases

- What happens when an admin attempts to delete a franchise that still has entries and milestones—block the deletion until child entries/milestones are removed, with guidance to clean up first.
- How does the system handle reparenting a milestone under one of its descendants? It must be rejected with a clear validation message.
- What happens when a counter milestone is set to target 0 or negative? The system must reject invalid targets and keep the previous valid value.
- How does the UI behave if another admin has edited the same item concurrently? Assume single-admin use; last write wins with refresh prompt.
- What happens when bulk operations include both optional and required entries? All selected items should follow the same confirmation and cascade rules.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide an admin backend surface that lists franchises with search/sort and selection to drill into their entries.
- **FR-002**: System MUST let admins create, edit, and delete franchises, capturing at least name and accent color; deletion MUST be blocked if the franchise still has entries/milestones, prompting the admin to remove them first.
- **FR-003**: System MUST list entries for a selected franchise with their media type, optional flag, display order, and completion preview, and allow create/edit/delete of entries.
- **FR-004**: System MUST allow reordering entries within a franchise and persist their display order.
- **FR-005**: System MUST show an entry's milestone tree and allow create, edit (including type change between checkbox/counter), delete, reorder, and reparent operations while preventing cycles and cross-entry moves.
- **FR-006**: System MUST validate milestone counters by enforcing target > 0 and clamping current between 0 and target; invalid inputs must be blocked with user feedback.
- **FR-007**: System MUST provide destructive action confirmations (franchise, entry, milestone, bulk) that state how many child records will be affected before proceeding.
- **FR-008**: System MUST persist each change so that a page reload reflects the latest edits, and show success/error feedback for every operation.
- **FR-009**: System MUST support duplication of a milestone subtree within the same entry, assigning new identifiers and preserving structure while resetting current progress to defaults.
- **FR-010**: System MUST support bulk delete of selected entries within a franchise with a single confirmation summarizing total milestones removed.
- **FR-011**: System MUST gate the admin backend to authorized users using local-only access (dev/protected network) with no additional auth until a stronger model is introduced.

### Assumptions

- Single trusted admin uses the backend at a time; conflicts are rare and resolved by last write wins with manual refresh.
- Deletions are hard deletes with cascades after confirmation; no soft-delete or version history is kept unless added later.
- Changes apply immediately to the live dataset; no draft/publish workflow unless clarified otherwise.

### Key Entities _(include if feature involves data)_

- **Franchise**: Represents a series with name and accent; contains ordered entries; may be deleted with cascading children after confirmation.
- **Entry**: Belongs to a franchise; has title, media type, optional flag, display order; contains milestones; participates in bulk operations.
- **Milestone**: Self-referential node within an entry; has type (checkbox/counter), target/current for counters, parent/children, and display order; supports duplication, reorder, reparent with cycle validation.
- **Admin session**: The actor context for performing CRUD; assumed authenticated/authorized per access decision.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An admin can create a new franchise with one entry and two milestones in under 3 minutes from landing on the admin backend.
- **SC-002**: After any save (franchise, entry, milestone), the updated data is visible on reload within 1 second of the operation completing.
- **SC-003**: Validation prevents 100% of attempted cycle reparent operations and rejects counter targets set to 0 or negative values.
- **SC-004**: Bulk delete confirmations accurately report the number of entries and milestones to be removed, and no unintended records remain after deletion in 100% of tested cases.
