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

## Conventions

- New API resource: add one file each to `router/`, `controller/`, `service/`, `repository/`, then register in `apps/api/src/routes.ts`.
- New shared frontend type: one file per resource under `apps/web/src/types/`.
- Formatting is enforced by Prettier (100 cols, double quotes, semicolons) + ESLint, run automatically on commit via husky/lint-staged — don't bypass with `--no-verify`.
