# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

KEPA is a German-language management app for a bowling/skittles ("Kegeln") club: members, championships (Meisterschaften), match days (Spieltage), result entry/output, statistics, PDF templates, circular e-mails and "Kegelfahrten" (trips, incl. films). UI text, identifiers, DB tables and comments are mostly German — keep that convention.

Stack: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4 + Radix/shadcn-style components (`components/ui`), Prisma 7 with the MariaDB driver adapter (MySQL DB), Jest + Testing Library.

## Commands

```bash
npm run dev            # next dev --turbopack
npm run build          # prisma generate && next build
npm run lint           # next lint
npm test               # jest (all tests)
npx jest path/to/file.test.ts            # single test file
npx jest -t "test name"                  # single test by name
npm run test:coverage
npm run test:integration:db   # startet die Wegwerf-MariaDB (docker-compose.integration.yml, Port 3307)
npm run build && npm run test:integration   # Integrationstests (echte DB + echter next start)
npm run pull:db        # prisma db pull (introspect existing DB into prisma/schema.prisma)
npm run prisma:generate
npm run generate:crud  # scripts/generate-crud-routes.ts: generates CRUD API routes from schema.prisma
```

Setup: copy `.env.beispiel` to `.env` and fill in `DATABASE_URL`, `JWT_SECRET`, admin/"FILME" user credentials (SHA-256 hashed passwords) and SMTP settings (two accounts: error mails and circular mails). Run `prisma generate` before building/testing if the client is missing.

## Architecture

- **Data layer**: `lib/prisma.ts` creates a singleton `PrismaClient` with `PrismaMariaDb` adapter (`server-only`). The schema in `prisma/schema.prisma` is introspected from a legacy DB (tables prefixed `tbl…`, e.g. `tblMitglieder`, `tblMeisterschaften`, `tblSpieltag`, one `tblSpiel…` table per game type: 6-Tage-Rennen, Blitztunier, Kombimeisterschaft, Meisterschaft, Pokal, SargKegeln, 9er/Ratten). Schema changes mean changing the DB then `pull:db`.
- **Server Actions** (`app/actions/**`, `"use server"`): the main data access path for pages. Organized by feature under `verwaltung/{ausgabe,eingabe,email,kegelfahrten,meisterschaften,mitglieder,statistik,common}` plus `db/*` (low-level table access) and `settings/` (current championship). `app/actions/index.ts` re-exports some of them. Tests live in sibling `__tests__` folders and mock Prisma.
- **Change log**: write operations are recorded in `tblDBChangeLog` via `utils/change-log-action.ts` / `create-change-log.ts` (includes IP/browser/OS derived from request headers). Keep this for new mutations.
- **API routes** (`app/api/**`): used for things that need HTTP responses — login/logout/auth, e-mail sending, and PDF generation (`vorlagen/*`, `statistik/pdf`, `mitglieder/statistik-pdf`) built with jsPDF through the `utils/vpe-to-jspdf.ts` wrapper (a port of the VPE report API: `write`, `writeBox`, margins, font attrs).
- **Auth**: `app/api/login` checks credentials and issues a JWT in an httpOnly `token` cookie (1h). Besides DB members there is an env-configured admin and a special "FILME" user (`isFilmeUser`, userId -1) restricted to the Kegelfahrten films. `proxy.ts` (Next 16's replacement for `middleware.ts`) verifies the JWT with `jose` for every route not in its `publicRoutes` allow-list (`/`, `/login`, `/impressum`, `/kontakt`, `/aktuelles`, `/termine`; matched with `startsWith`) and redirects pages to `/login?redirectTo=` or returns 401 JSON for `/api/`. Client side: `providers/` (auth context) and `components/verwaltung-guard.tsx`.
- **Pages**: public pages at `app/*`, the admin area at `app/verwaltung/*` (eingabe, ausgabe, mitglieder, meisterschaften, statistik, vorlagen, email, kegelfahrten, benutzerzugriff, profil). Page-specific components go in a `_components` folder next to the page. Shared types are split between `interfaces/`, `types/` and `zod/` (form validation schemas).
- **Path alias**: `@/` maps to the repo root (tsconfig and Jest `moduleNameMapper`).

## Testing notes

Jest uses `next/jest` with jsdom; `jest.setup.ts` mocks `next/navigation` and `matchMedia`. Tests match `__tests__/**` or `*.test.ts(x)` and sit next to the code they cover (actions, components, pages, API routes).

## Integration tests

`integration/*.int.test.ts` (own config `jest.integration.config.cjs`, excluded from `npm test`) run against a **real MariaDB and a real `next start` server — no Prisma mocks**. `integration/global-setup.cjs` applies the schema via `prisma db push`, starts the server on port 3100 and refuses to run unless the DB name in `INTEGRATION_DATABASE_URL` (default `mysql://root:root@127.0.0.1:3307/kepa_test`) contains "test". Requires a prior `npm run build`. Tests run sequentially; each file resets the tables with `resetDb()`/`seedBasis()` (`integration/helpers`). Two styles: HTTP tests via `api()` (auth/proxy, login, PDFs, e-mail routes) and direct Server-Action calls (only `next/headers`/`next/cache` are stubbed in `integration/setup.ts`). CI runs them in the `integration-tests` job with a MariaDB service container (`.github/workflows/ci.yml`). Note: do not use `prisma db push --force-reset` from an AI agent — Prisma blocks it.

## Docs

`anleitung/` contains the German end-user manual (docx/pdf + screenshots) — useful for understanding the intended workflows.
