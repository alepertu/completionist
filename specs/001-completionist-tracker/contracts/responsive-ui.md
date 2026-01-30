# Component Contracts — Responsive Mobile UI

## MobileMenuContext

### Interface

```typescript
interface MobileMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}
```

### Provider Props

```typescript
interface MobileMenuProviderProps {
  children: React.ReactNode;
}
```

### Behavior

- `isOpen` defaults to `false`
- `open()` sets `isOpen` to `true`
- `close()` sets `isOpen` to `false`
- `toggle()` inverts `isOpen`
- Automatically closes when route changes (via `usePathname` effect)
- Closes when clicking outside overlay (backdrop click handler)

---

## useMediaQuery Hook

### Interface

```typescript
function useMediaQuery(query: string): boolean;
```

### Usage

```typescript
const isMobile = useMediaQuery("(max-width: 767px)");
```

### Behavior

- Returns `false` during SSR (safe hydration)
- Listens to `window.matchMedia` changes
- Cleans up listener on unmount
- Updates synchronously on resize

---

## MobileMenu Component

### Props

```typescript
interface MobileMenuProps {
  /** Content to render inside the slide-in panel */
  children: React.ReactNode;
}
```

### Structure

```tsx
<>
  {/* Hamburger Button - fixed position, only visible on mobile */}
  <button
    className="fixed top-4 left-4 z-50 md:hidden touch-target"
    onClick={toggle}
    aria-label="Toggle menu"
    aria-expanded={isOpen}
  >
    <HamburgerIcon />
  </button>

  {/* Backdrop - click to close */}
  {isOpen && (
    <div
      className="fixed inset-0 bg-black/50 z-40 md:hidden"
      onClick={close}
      aria-hidden="true"
    />
  )}

  {/* Slide-in Panel */}
  <aside
    className={`
      fixed top-0 left-0 h-full w-64 z-50 
      transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:relative md:translate-x-0 md:transition-none
    `}
  >
    {children}
  </aside>
</>
```

### Accessibility

- `aria-label` on hamburger button
- `aria-expanded` reflects menu state
- Backdrop is `aria-hidden`
- Focus trap inside panel when open (optional enhancement)

---

## FranchiseSidebar (Modified)

### Changes

```diff
- <aside className="w-64 min-h-screen bg-slate-900 ...">
+ <aside className="w-64 min-h-screen bg-slate-900 ... hidden md:flex md:flex-col">
```

On mobile, sidebar content is rendered inside `MobileMenu` component instead of directly in layout.

### Responsive Behavior

- `md:flex` — visible on tablet and desktop
- `hidden` — hidden on mobile (content moved to overlay)

---

## MilestoneTree (Modified)

### Touch Target Changes

```diff
- <button className="w-6 h-6 ...">
+ <button className="touch-target flex items-center justify-center ...">
```

### Indentation Scaling

```diff
- style={{ paddingLeft: `${depth * 24}px` }}
+ className={`pl-${depth * 4} md:pl-${depth * 6}`}
```

Or using inline style with responsive calc:

```typescript
const indent = isMobile ? depth * 16 : depth * 24;
```

---

## Entry Carousel (Modified in layout.tsx)

### Mobile Adaptations

```diff
- <div className="flex gap-3 overflow-x-auto ...">
+ <div className="flex gap-2 md:gap-3 overflow-x-auto scroll-snap-x snap-mandatory ...">
```

### Scroll Snap

```css
.scroll-snap-x {
  scroll-snap-type: x mandatory;
}

.snap-center {
  scroll-snap-align: center;
}
```

### Item Width

```diff
- className="shrink-0 w-44 ..."
+ className="shrink-0 w-[calc(100vw-3rem)] md:w-44 snap-center ..."
```

On mobile: full-width minus padding for single-item view with swipe.
On desktop: fixed 176px width.

---

## CSS Utilities (globals.css)

### New Classes

```css
@layer utilities {
  .touch-target {
    @apply min-h-[44px] min-w-[44px];
  }

  .scroll-snap-x {
    scroll-snap-type: x mandatory;
  }

  .snap-center {
    scroll-snap-align: center;
  }
}
```
