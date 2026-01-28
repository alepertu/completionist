# Quickstart — Admin Backend Editor

1. Install deps

- `yarn install`

2. Configure env

- Copy `.env.example` to `.env`
- Add `ADMIN_TOKEN=changeme` for admin gate (leave empty to disable locally)
- Set `DATABASE_URL=postgres://user:pass@host:5432/completionist`

3. Database

- `yarn db:migrate`
- `yarn db:seed`

4. Run dev server

- `yarn dev`
- Visit `/admin` and provide `ADMIN_TOKEN` via header/cookie per middleware prompt

5. Tests

- Unit/integration: `yarn test`
- E2E (admin flows): `yarn e2e`

Notes

- Franchise delete is blocked if entries/milestones exist; clean children first.
- Admin gate is minimal local-only; replace with stronger auth when needed.
- Bulk entry deletes show a confirmation with the total milestones that will be removed.
