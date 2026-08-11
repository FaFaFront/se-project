# SE Project

Monorepo: Next.js frontend + Express API, Prisma/Postgres, Swagger docs, Storybook.

## Stack

- **apps/web** — Next.js, Tailwind CSS, shadcn/ui, lucide-react, Storybook
- **apps/api** — Express, Prisma, PostgreSQL, Swagger (`swagger-jsdoc` + `swagger-ui-express`)
  - Layers: `router/` → `controller/` → `service/` → `repository/`. Validation
    (zod) lives in the controller; no separate DTO layer.

## Getting started

```bash
yarn install

# start Postgres in Docker
yarn db:create

# generate the Prisma client and push the schema
yarn db:generate
yarn db:push

# run everything (in separate terminals)
yarn api:dev      # http://localhost:4000  (docs at /api-docs)
yarn web:dev       # http://localhost:3000
yarn web:storybook # http://localhost:6006
```

Copy each app's `.env.example` to `.env` before running it.

## Adding a new API resource

Add one file to each of `apps/api/src/{router,controller,service,repository}`
following the `task.*.ts` example, then register the router in
`apps/api/src/routes.ts`.

## Adding a new frontend type

Shared types (e.g. API response shapes) go in `apps/web/src/types/`, one file per
resource, so components import them instead of redeclaring them.

## Scripts

See root `package.json` for the full list (`lint`, `format`, `db:*`, `web:*`, `api:*`).
