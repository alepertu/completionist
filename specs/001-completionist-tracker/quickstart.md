# Quickstart — Completionist Progress Tracker (T3 Stack)

1. Install deps

- `npm install` (Next.js, tRPC, Prisma, Tailwind included)

2. Configure environment

- Copy `.env.example` → `.env`
- Set `DATABASE_URL=postgres://user:pass@host:5432/completionist`

3. Database setup

- `npx prisma migrate dev --name init_completionist`
- `npx prisma db seed` (optional: seed franchises/entries/milestones)

4. Dev server

- `npm run dev` (Next.js App Router)

5. Tests

- Unit/integration: `npm run test` (Vitest + tRPC integration)
- E2E: `npm run e2e` (Playwright)

6. Working in the app

- Sidebar (Franchises) persists via root layout; selecting franchise sets accent context and optional-entry toggle.
- Entry carousel uses nested layout; switching entries triggers milestone tree fetch and completion recompute.
- Profile/settings exposes the optional-entry inclusion toggle; changing it refetches/recomputes completion.

## Mobile Testing

### Browser DevTools

1. Open Chrome/Edge DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select a mobile device preset (iPhone 12, Pixel 5, etc.)
4. Test at various widths: 320px, 375px, 414px, 768px

### Responsive Breakpoints

| Width | Behavior |
|-------|----------|
| < 768px | Sidebar hidden, hamburger menu visible, full-width carousel items |
| ≥ 768px | Sidebar visible, hamburger hidden, fixed-width carousel items |

### Touch Target Verification

1. In DevTools, enable "Show touch targets" overlay if available
2. All interactive elements should have minimum 44×44px hit area
3. Test on real device for actual touch behavior

### Playwright Mobile Tests

```bash
# Run mobile-specific e2e tests
npm run e2e -- tests/e2e/mobile-navigation.spec.ts

# Run with specific viewport
npx playwright test --project=mobile-chrome
```

### Playwright Config (add to playwright.config.ts)

```typescript
projects: [
  // ... existing projects
  {
    name: 'mobile-chrome',
    use: {
      ...devices['Pixel 5'],
    },
  },
  {
    name: 'mobile-safari',
    use: {
      ...devices['iPhone 12'],
    },
  },
]
```

### Manual Mobile Testing Checklist

- [ ] Hamburger icon visible on screens < 768px
- [ ] Tapping hamburger opens sidebar overlay with slide animation
- [ ] Tapping backdrop or selecting franchise closes overlay
- [ ] Carousel items swipe smoothly on touch devices
- [ ] Milestone tree indentation fits without horizontal scroll
- [ ] All checkboxes and counter buttons are easy to tap
- [ ] Landscape orientation works without sidebar appearing
- [ ] Hamburger stays fixed when scrolling content

