# AGENTS.md

Guidance for AI coding agents working in this repository. See `CLAUDE.md` for the fuller version (Claude Code reads that file automatically); this file is the tool-agnostic summary for other agents.

## Setup & commands

```bash
yarn install
yarn db:create && yarn db:generate && yarn db:push   # Postgres via Docker + Prisma schema

yarn api:dev   # Express API — http://localhost:4000 (Swagger at /api-docs)
yarn web:dev   # Next.js — http://localhost:3000

yarn lint / yarn lint:fix
yarn format / yarn format:check
yarn workspace api check   # tsc --noEmit for apps/api
```

Copy `apps/api/.env.example` → `apps/api/.env` and `apps/web/.env.example` → `apps/web/.env` before running. There is no test suite configured in this repo.

## Structure

Yarn workspaces monorepo, two independent apps talking only over HTTP:

- `apps/api` — Express + Prisma/Postgres, layered `router/ → controller/ → service/ → repository/` per resource (see `task.*.ts` for the pattern). Validation is zod in the controller; no DTO layer. Every response is `{ success, message, data }`, thrown via `common/errors/app-error.ts` typed errors and centralized in `common/middleware/error-handler.middleware.ts`.
- `apps/web` — Next.js App Router. Server Components fetch data (`lib/api-client.ts`, which unwraps the `{ success, data }` envelope); anything interactive needs its own `"use client"` component, and mutations should call `router.refresh()` afterward since there's no client cache.
  - `src/features/<domain>/` — business-specific components grouped by feature (`auth`, `profile`, `wallet`); e.g. `features/auth/login-panel.tsx` wires the presentational form to the API and router.
  - `src/components/ui/` — base/design-system primitives (button, input, select, ...), documented in `DESIGN.md`.
  - `src/components/guards/auth-guard.tsx` (`AuthGuard`) — the single client-side route guard, mounted once in `app/layout.tsx`. Matches the path against a `ROUTE_RULES` table (guest-only / profile-completion-required / role-restricted per prefix) and redirects before rendering — add a route there instead of a new `layout.tsx`.
  - `src/components/Navbar.tsx`, `Footer.tsx` — global app shell, not tied to one feature.
  - `src/contexts/auth-context.tsx` — `AuthProvider` + `useAuth()`, the single source of truth for the signed-in user's profile (`GET /users/me`). `AuthGuard`, `Navbar`, and profile/wallet features read from it instead of each fetching independently; call `refresh()` after a mutation that can change role/profile-completion/wallet state.

## Conventions

- New API resource: add one file each to `router/`, `controller/`, `service/`, `repository/`, then register in `apps/api/src/routes.ts`.
- New shared frontend type: one file per resource under `apps/web/src/types/`.
- New frontend feature UI goes under `apps/web/src/features/<domain>/`, not `components/`; `components/` is reserved for the design system (`ui/`), route guards (`guards/`), and app-shell pieces (`Navbar`, `Footer`).
- New protected/guest page: add a prefix to `ROUTE_RULES` in `apps/web/src/components/guards/auth-guard.tsx`.
- Formatting is enforced by Prettier (100 cols, double quotes, semicolons) + ESLint, run automatically on commit via husky/lint-staged — don't bypass with `--no-verify`.
