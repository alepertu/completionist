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
