# Implementation Plan: Responsive Mobile Interface

**Branch**: `001-completionist-tracker` | **Date**: 2026-01-29 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-completionist-tracker/spec.md`

**Note**: This plan covers the responsive/mobile-friendly updates (FR-016 to FR-019, User Story 4).

## Summary

Add responsive design to the Completionist Tracker so the interface adapts gracefully to screens narrower than 768px. The sidebar collapses to a hamburger menu with slide-in overlay, the entry carousel becomes touch-friendly with swipe support, and the milestone tree scales indentation and touch targets to at least 44×44 pixels.

## Technical Context

**Language/Version**: TypeScript 5.3.3  
**Primary Dependencies**: Next.js 14.2, React 18.2, Tailwind CSS 3.4, tRPC 11, Prisma 7.3  
**Storage**: PostgreSQL (via Prisma)  
**Testing**: Vitest (unit), Playwright (e2e)  
**Target Platform**: Web (desktop + mobile browsers, iOS Safari, Android Chrome)  
**Project Type**: web (Next.js app router)  
**Performance Goals**: Sidebar animation <300ms, touch targets 44×44px minimum  
**Constraints**: No horizontal scrolling on screens ≥320px, all desktop features preserved on mobile  
**Scale/Scope**: Single-user app, ~10 screens affected by responsive changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Constitution not yet configured | ✅ PASS | Template placeholders present; no blocking gates defined |

**Pre-Phase 0 Status**: ✅ PASS — No constitution violations identified.

## Project Structure

### Documentation (this feature)

```text
specs/001-completionist-tracker/
├── plan.md              # This file
├── research.md          # Phase 0 output — responsive patterns research
├── data-model.md        # Phase 1 output — no schema changes needed
├── quickstart.md        # Phase 1 output — mobile testing guide
├── contracts/           # Phase 1 output — component interface contracts
│   └── trpc.md          # Existing tRPC contracts (unchanged)
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── layout/
│   │   └── MobileMenu.tsx           # NEW: Hamburger + slide-in overlay
│   ├── sidebar/
│   │   └── FranchiseSidebar.tsx     # MODIFY: Responsive breakpoint logic
│   └── milestones/
│       └── MilestoneTree.tsx        # MODIFY: Touch targets & indentation
├── context/
│   └── mobile-menu-context.tsx      # NEW: Menu open/close state
└── hooks/
    └── useMediaQuery.ts             # NEW: Responsive breakpoint detection

app/
├── franchises/
│   └── [franchiseId]/
│       └── layout.tsx               # MODIFY: Responsive carousel + mobile header
└── layout.tsx                       # MODIFY: Wrap with MobileMenuProvider

tests/
├── e2e/
│   └── mobile-navigation.spec.ts    # NEW: Playwright mobile viewport tests
└── unit/
    └── useMediaQuery.test.ts        # NEW: Hook tests
```

**Structure Decision**: Extend existing Next.js app structure. No new packages or major architectural changes. Responsive logic added via Tailwind breakpoints + React context for mobile menu state.

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | — | — |

---

## Phase 0: Research Completed

See [research.md](research.md) for detailed decisions on:
- Tailwind responsive breakpoints strategy
- CSS transitions for sidebar animation
- Touch gesture handling patterns
- Mobile-first vs desktop-first approach

## Phase 1: Design Artifacts

### Components to Create/Modify

| Component | Action | Purpose |
|-----------|--------|---------|
| `MobileMenu.tsx` | CREATE | Hamburger icon + slide-in overlay for franchises |
| `MobileMenuProvider` | CREATE | React context for menu open/close state |
| `useMediaQuery.ts` | CREATE | Hook to detect `< 768px` breakpoint |
| `FranchiseSidebar.tsx` | MODIFY | Hide on mobile, render inside overlay |
| `layout.tsx` (franchise) | MODIFY | Add hamburger button, responsive carousel |
| `MilestoneTree.tsx` | MODIFY | Scale indentation, increase touch targets |

### Tailwind Utilities to Add

```css
/* globals.css additions */
@layer utilities {
  .touch-target {
    @apply min-h-[44px] min-w-[44px];
  }
}
```

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< 768px` (mobile) | Sidebar hidden, hamburger visible, carousel full-width swipe |
| `≥ 768px` (tablet+) | Sidebar visible, hamburger hidden, carousel with scroll arrows |

---

## Files Modified/Created

### New Files
1. `src/components/layout/MobileMenu.tsx`
2. `src/context/mobile-menu-context.tsx`
3. `src/hooks/useMediaQuery.ts`
4. `tests/e2e/mobile-navigation.spec.ts`
5. `tests/unit/useMediaQuery.test.ts`

### Modified Files
1. `src/components/sidebar/FranchiseSidebar.tsx` — Add responsive visibility
2. `src/components/milestones/MilestoneTree.tsx` — Touch targets + indentation
3. `app/franchises/[franchiseId]/layout.tsx` — Mobile header + carousel
4. `app/layout.tsx` — Wrap with MobileMenuProvider
5. `src/styles/globals.css` — Add `.touch-target` utility

---

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| Constitution not configured | ✅ PASS | No violations |

**Post-Phase 1 Status**: ✅ PASS — Ready for Phase 2 task generation.
