# Feature Specification: Completionist Progress Tracker

**Feature Branch**: 001-completionist-tracker  
**Created**: 2026-01-25  
**Status**: Draft  
**Input**: Build a progress-tracking application designed specifically for 100% completionists. The Hierarchy: The app organizes content into Franchises (e.g., "The Legend of Zelda"), which contain Entries (specific games, books, or movies). Each Entry features a checklist of Milestones. These Milestones must support infinite nesting (e.g., a "World" contains "Levels," which contain "Collectibles") to capture granular progress. Milestone Logic: Support two types of tracking: Checkboxes for one-time tasks. Counters for quantitative goals (e.g., "0/120 Stars") to provide real-time progress feedback. The Interface (Wii-Inspired): The UI is a clean, pure-white minimalist dashboard. Navigation uses a vertical sidebar to switch between Franchises and a horizontal top carousel to switch between Entries. The central area displays overall completion metrics and the nested milestone checklist. Visual Identity: Each Franchise is assigned a unique, bright neon accent color. This color dynamically updates the UI for that franchise, appearing in progress bars, active selection glows, and completed checkmarks to make each series feel distinct within the clean white environment.

## Clarifications

### Session 2026-01-26

- Q: How should optional/recommended entries affect franchise completion? → A: Let the user choose via profile settings between including optional entries (option A) or excluding them from the denominator (option B).
- Q: How to model binary media (books/movies) with no internal progress? → A: Auto-create a single checkbox milestone per binary entry so roll-up math remains consistent.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Track franchise and entry progress (Priority: P1)

A completionist selects a franchise from the sidebar, switches entries via the top carousel, and views overall completion plus nested milestones for the chosen entry.

**Why this priority**: Core value is surfacing a truthful completion picture per franchise and entry, enabling the user to see where effort remains.

**Independent Test**: With one franchise and one entry preloaded, user can navigate to the entry, see completion percentage, and expand milestones without configuring anything else.

**Acceptance Scenarios**:

1. **Given** a franchise with at least one entry, **When** the user selects the franchise and entry, **Then** the dashboard shows overall completion percentage and milestone tree for that entry.
2. **Given** a multi-level milestone tree, **When** the user expands or collapses levels, **Then** the tree preserves hierarchy and shows current completion states for each node.

---

### User Story 2 - Update milestone progress (Priority: P2)

User marks checkboxes or increments counters within a deeply nested milestone tree and sees aggregated progress update instantly at parent, entry, and franchise levels.

**Why this priority**: Updating milestones is how users express progress; accuracy and responsiveness keep trust in the tracker.

**Independent Test**: With an existing milestone tree, user can toggle a checkbox and increment a counter and see recalculated percentages without needing to create new data.

**Acceptance Scenarios**:

1. **Given** a checkbox milestone, **When** the user marks it complete, **Then** the milestone and its ancestors reflect updated completion percentages.
2. **Given** a counter milestone with a target, **When** the user increments to the target value, **Then** the milestone is marked complete and parent totals update.
3. **Given** mixed milestone types across 3+ nesting levels, **When** multiple updates occur, **Then** the entry completion metric reflects the combined changes within one refresh.

---

### User Story 3 - Configure structure and identity (Priority: P3)

User creates or edits franchises, entries, and milestones (including nesting and counter targets) and assigns a neon accent color that updates the UI styling for that franchise.

**Why this priority**: Flexibility to model any franchise and distinct visual identity keeps the tracker usable across different series.

**Independent Test**: Starting from an empty state, user can add a franchise with accent color, add an entry, add nested milestones with a counter, and see the UI adopt the chosen accent.

**Acceptance Scenarios**:

1. **Given** no existing data, **When** the user creates a franchise with an accent color and adds an entry, **Then** the sidebar and carousel show them using the selected color.
2. **Given** a new milestone, **When** the user selects type checkbox or counter and sets a counter target, **Then** the milestone is created within the chosen parent level and shown in the checklist.
3. **Given** an existing franchise, **When** the user changes the accent color, **Then** the dashboard updates progress bars, active states, and checkmarks to the new color without affecting other franchises.

### User Story 4 - Use the app on mobile devices (Priority: P2)

User accesses the completionist tracker on a smartphone or tablet and navigates franchises, entries, and milestones with a responsive interface that adapts to the smaller screen.

**Why this priority**: Mobile access is essential for logging progress on-the-go while playing, reading, or watching; a non-responsive UI would make the app unusable for a significant portion of user sessions.

**Independent Test**: With existing franchise and entry data, user on a mobile device can open the hidden menu, select a franchise, swipe or tap through the carousel, and expand milestones without horizontal scrolling or unreadable text.

**Acceptance Scenarios**:

1. **Given** the user opens the app on a screen narrower than 768px, **When** the page loads, **Then** the sidebar collapses to a hidden menu accessible via a hamburger icon.
2. **Given** the sidebar is collapsed, **When** the user taps the hamburger icon, **Then** the sidebar slides in as an overlay showing all franchises, and tapping outside or selecting a franchise closes it.
3. **Given** a small screen, **When** the user views the entry carousel, **Then** entries display in a touch-friendly horizontal scroll or swipe layout that fits within the viewport width.
4. **Given** a deeply nested milestone tree on mobile, **When** the user expands levels, **Then** the tree remains navigable with proper indentation scaled to screen size and touch targets of at least 44×44 pixels.

---

### Edge Cases

- Empty state: franchise with no entries or entry with no milestones should show 0% completion and a prompt to add items without errors.
- Deep nesting (5+ levels) remains navigable via expand/collapse, and progress rolls up correctly to each ancestor.
- Counter milestones do not allow negative values and cap at the defined target; attempts beyond the target keep the value at target and maintain completion at 100%.
- Deleting or reparenting a milestone with children recalculates progress to exclude/move that subtree and preserves child definitions.
- Accent colors that would reduce contrast trigger an automatic fallback or warning so text and progress indicators stay legible on the white UI.
- On mobile, the hidden sidebar menu must remain accessible when the carousel or milestone tree is scrolled; the hamburger icon stays fixed.
- Landscape orientation on mobile should use available width efficiently without triggering the full desktop sidebar layout.
- Touch interactions on milestone checkboxes and counters should not conflict with swipe gestures for the carousel or sidebar.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Users can create, edit, and archive franchises with required fields for name and a bright neon accent color unique to that franchise.
- **FR-002**: Users can create, edit, and archive entries within a selected franchise, with title and optional media type/ordering to appear in the top carousel.
- **FR-003**: Users can add milestones at any hierarchy level with attributes: title, type (checkbox or counter), optional description, order, and optional due/order notes.
- **FR-004**: Counter milestones require a target number; progress percentage for counters is computed as current ÷ target, and completion locks at 100% once target is reached.
- **FR-005**: Parent milestone completion is the average of its immediate children’s completion percentages; entry completion aggregates all top-level milestones; franchise completion aggregates its entries.
- **FR-006**: Users can reorder or reparent milestones while preserving child branches, and the system recalculates completion based on the new hierarchy.
- **FR-007**: The milestone checklist supports expand/collapse per node, showing a summary (completed/total and percent) when collapsed.
- **FR-008**: The dashboard center panel displays for the active entry: overall completion percentage, counts of completed vs. total milestones, and nested checklist with real-time updates after any change.
- **FR-009**: Navigation uses a vertical sidebar for franchise selection and a horizontal carousel for entries; selecting either updates the central panel to that context without page reloads.
- **FR-010**: The active franchise’s accent color applies to progress bars, active navigation states, and completed checkmarks; switching franchises updates styling immediately without affecting stored progress.
- **FR-011**: Users can increment/decrement counter milestones with single-step controls; the system prevents values below zero and above target while showing current/target (e.g., "45/120").
- **FR-012**: All progress data (franchises, entries, milestones, and states) persists between sessions and restores the last selected franchise and entry when the user returns.
- **FR-013**: Users can flag entries as optional/recommended; franchise completion can include or exclude optional entries based on a user preference in the profile/settings page.
- **FR-014**: Profile/settings page exposes a toggle that switches franchise completion between including optional entries (option A) or excluding them from the denominator (option B); changing the toggle recalculates completion immediately.
- **FR-015**: Binary media entries (e.g., books, movies) auto-create a single checkbox milestone representing completion; deleting this milestone removes completion, and re-adding restores the binary state so roll-up math stays consistent.
- **FR-016**: The interface is fully responsive; on screens narrower than 768px, the vertical sidebar collapses to a hidden menu accessible via a hamburger icon that triggers a slide-in overlay.
- **FR-017**: On small screens, the entry carousel adapts to a horizontal swipe/scroll layout that fits within the viewport width and supports touch gestures.
- **FR-018**: The milestone tree adapts to small screens with proper indentation scaling, and all interactive elements (checkboxes, counters, expand/collapse) maintain touch-friendly target sizes of at least 44×44 pixels.
- **FR-019**: Responsive layout changes preserve all functionality available on desktop; no features are hidden or disabled on mobile.

### Key Entities _(include if feature involves data)_

- **Franchise**: Collection defined by name and accent color; holds ordered entries; stores aggregate completion across entries.
- **Entry**: Item within a franchise (game/book/movie, etc.); has title, optional media type, display order, optional flag indicating optional/recommended status, milestone tree root (auto-seeded with a single checkbox milestone for binary media), and aggregate completion for that entry.
- **Milestone**: Node in a hierarchy; attributes include title, type (checkbox or counter), target (for counters), current progress, order, parent reference, and derived completion percent.
- **Progress Summary**: Calculated totals per franchise and per entry, including completed vs. total milestones, percentage complete, and counts of checkbox vs. counter items.
- **User Preferences**: Stores settings including whether optional entries are included in franchise completion; preferences are persisted and applied to all franchise calculations.

### Assumptions

- Single-user context; no multi-user collaboration or permissions in this iteration.
- No hard cap on nesting depth beyond practical UI performance; calculations must handle at least 5 levels and 500 milestones per entry.
- Accent colors are user-chosen from a preset neon palette to reduce contrast issues; fallback rules handle invalid or low-contrast choices.
- Increment step for counters is 1 unit; partial increments are out of scope.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can set up a new franchise, entry, and a 3-level milestone tree and reach 100% completion for that entry within 10 minutes without guidance in usability testing.
- **SC-002**: After any checkbox toggle or counter change, visible completion indicators (milestone, entry, franchise) reflect the new value within a perceived 1 second and remain accurate within ±1% for trees up to 500 milestones and 5 levels.
- **SC-003**: In moderated tests, 90% of users navigate between two franchises and three entries using sidebar and carousel in under 30 seconds while maintaining previously saved progress.
- **SC-004**: Accent color updates propagate to progress bars, active navigation states, and checkmarks for the selected franchise in 100% of tested screens across at least three distinct franchises.
- **SC-005**: Closing and reopening the app restores the last selected franchise/entry and previously recorded progress in 5 consecutive trials with no data loss.
- **SC-006**: Toggling the optional-entry inclusion setting in the profile page recalculates franchise completion within a perceived 1 second and reflects the chosen mode across all franchises.
- **SC-007**: Creating a binary media entry auto-adds a single checkbox milestone and marks franchise/entry completion accurately when toggled in 5 consecutive trials.
- **SC-008**: On screens narrower than 768px, the sidebar collapses to a hidden menu in 100% of tested devices (iOS, Android) and opens/closes within 300ms when the hamburger icon is tapped.
- **SC-009**: Users can complete the same setup-and-update flow on a mobile device (smartphone) as on desktop in under 15 minutes without horizontal scrolling or misclicks due to small touch targets.
- **SC-010**: The entry carousel supports swipe navigation on touch devices, with entries remaining fully visible within viewport width on screens as narrow as 320px.
- **SC-011**: Milestone tree touch targets meet the 44×44 pixel minimum in 100% of interactive elements when tested on a 375px-wide screen.
